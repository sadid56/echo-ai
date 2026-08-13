"""
runner.py

Cross-platform Playwright automation runner. Drives a real Chromium-family
browser (Chrome / Edge / Brave / Chromium) through a sequence of high-level
steps -- navigate, search, click, type, scroll, wait, wait_for, wait_for_load,
upload, screenshot, extract -- and returns page text plus a list of
interactive-element selectors that a scraping/agent layer can act on next.

Built with job-search / general web-search automation in mind:
  - selectors are resolved across iframes, not just the main frame
    (many application forms and search widgets live inside one)
  - new tabs/popups opened during a run (e.g. "Apply" -> new tab) are
    detected and automatically become the active page for later steps
  - common CAPTCHA / bot-wall pages are detected after navigation; the
    run pauses briefly (the browser window is visible, so a human can
    clear it) and always reports what it saw instead of silently
    continuing or failing
  - scrolling stops early once no new content loads, instead of blindly
    scrolling a fixed number of times

Contract with the caller (kept intentionally stable, e.g. for a parent
process that reads stdout):
  - progress/diagnostic lines are printed to stdout prefixed with "[LOG]"
  - the final structured result is printed as a single JSON line, now
    including "bot_checks_detected" (list of strings, empty if none) and
    "final_url" (where the run ended up, useful if a popup/redirect moved
    the active tab)
"""

from __future__ import annotations

import json
import os
import platform
import shutil
import sys
import tempfile
import time
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.parse import quote_plus

from agent.config import AgentConfig


CDP_PORT = 9222
NAV_TIMEOUT_MS = 15_000
ACTION_TIMEOUT_MS = 8_000
CLOSE_WAIT_TIMEOUT_MS = 900_000  
MAX_EXTRACT_CHARS = 3000
MAX_INTERACTIVE_ELEMENTS = 45
DEFAULT_SEARCH_QUERY = "Full Stack developer in Bangladesh and Remote"
BOT_WALL_POLL_INTERVAL_S = 3
BOT_WALL_MAX_WAIT_S = 120

PLACEHOLDER_URL_MARKERS = ("example", "jobboard", "placeholder", "fake")
_BOT_WALL_TITLE_MARKERS = (
    "just a moment", "attention required", "access denied", "are you human",
)
_BOT_WALL_TEXT_MARKERS = (
    "verify you are human", "are you a robot", "unusual traffic",
    "captcha", "recaptcha", "hcaptcha", "checking your browser",
    "just a moment", "cloudflare", "access denied", "attention required",
    "please enable javascript and cookies",
)
_BOT_WALL_FRAME_URL_MARKERS = (
    "recaptcha", "hcaptcha", "captcha", "arkoselabs", "perimeterx", "datadome",
)

# per operating system (platform.system() -> "Linux" | "Darwin" | "Windows").
_PATH_CANDIDATES_BY_OS: Dict[str, List[str]] = {
    "Linux": [
        "google-chrome-stable", "google-chrome", "brave-browser", "brave",
        "chromium", "chromium-browser", "microsoft-edge-stable", "microsoft-edge",
    ],
    "Darwin": [
        "google-chrome", "chromium", "brave-browser", "microsoft-edge",
    ],
    "Windows": [
        "chrome", "chrome.exe", "msedge", "msedge.exe", "brave", "brave.exe",
    ],
}

# Well-known install locations checked when nothing turns up on PATH.
_FIXED_PATHS_BY_OS: Dict[str, List[str]] = {
    "Darwin": [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ],
    "Windows": [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe"),
    ],
    "Linux": [
        "/usr/bin/google-chrome-stable",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
        "/snap/bin/chromium",
    ],
}
_EXTRACT_INTERACTIVE_JS_TEMPLATE = r"""
(() => {
    const interactive = [];
    document.querySelectorAll('input, select, textarea, button, [role="button"], a').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const tag = el.tagName.toLowerCase();
        let label = '';
        let selector = '';

        if (tag === 'input' || tag === 'textarea') {
            const type = el.getAttribute('type') || 'text';
            const placeholder = el.getAttribute('placeholder') || '';
            const name = el.getAttribute('name') || '';
            const id = el.getAttribute('id') || '';
            label = `Input (type=${type}, placeholder="${placeholder}", name="${name}")`;

            if (id) selector = `#${id}`;
            else if (name) selector = `input[name="${name}"]`;
            else if (placeholder) selector = `input[placeholder="${placeholder}"]`;
        } else if (tag === 'button' || el.getAttribute('role') === 'button') {
            const text = el.innerText.trim();
            const name = el.getAttribute('name') || '';
            const id = el.getAttribute('id') || '';
            label = `Button (text="${text}", name="${name}")`;

            if (id) selector = `#${id}`;
            else if (name) selector = `button[name="${name}"]`;
            else if (text) selector = `text=${text}`;
        } else if (tag === 'a') {
            const text = el.innerText.trim();
            if (!text) return;
            label = `Link (text="${text}")`;
            selector = `text=${text}`;
        } else if (tag === 'select') {
            const name = el.getAttribute('name') || '';
            const id = el.getAttribute('id') || '';
            label = `Select (name="${name}")`;
            if (id) selector = `#${id}`;
            else selector = `select[name="${name}"]`;
        }

        if (selector && label) {
            interactive.push(`* ${label} -> selector: ${selector}`);
        }
    });
    return interactive.slice(0, __MAX_ELEMENTS__).join('\n');
})()
"""
_EXTRACT_INTERACTIVE_JS = _EXTRACT_INTERACTIVE_JS_TEMPLATE.replace(
    "__MAX_ELEMENTS__", str(MAX_INTERACTIVE_ELEMENTS)
)


def get_system_browser_path() -> Optional[str]:
    """Locate an installed Chromium-family browser on Linux, macOS, or Windows.

    Checks PATH first (fast, works in most dev/CI environments), then falls
    back to well-known install locations for the current OS.
    """
    system = platform.system() 

    for name in _PATH_CANDIDATES_BY_OS.get(system, []):
        found = shutil.which(name)
        if found:
            return found

    for path in _FIXED_PATHS_BY_OS.get(system, []):
        if path and os.path.exists(path):
            return path

    return None


class BrowserRunner:
    """Drives a Chromium browser through a sequence of high-level steps and
    returns page text + interactive-element selectors, ready for scraping
    or for handing back to an agent to decide the next action.
    """

    def __init__(self) -> None:
        self.config = AgentConfig()
        self._pages: List[Any] = []
        self._bot_wall_events: List[str] = []

        # (only "extract" returns a value; the rest return None)
        self._action_handlers: Dict[str, Callable[[Any, dict], Optional[str]]] = {
            "navigate": self._do_navigate,
            "search": self._do_search,
            "click": self._do_click,
            "type": self._do_type,
            "scroll": self._do_scroll,
            "wait": self._do_wait,
            "wait_for": self._do_wait_for,
            "wait_for_load": self._do_wait_for_load,
            "upload": self._do_upload,
            "screenshot": self._do_screenshot,
            "extract": self._do_extract,
        }

    def log(self, message: str) -> None:
        try:
            print(f"[LOG] {message}")
            sys.stdout.flush()
        except BrokenPipeError:
            pass
        except Exception:
            pass


    def run(self, url: str, query: str) -> dict:
        """Convenience wrapper: navigate to a URL, settle, then extract."""
        steps = [
            {"action": "navigate", "url": url},
            {"action": "wait", "seconds": 2},
            {"action": "extract"},
        ]
        return self.run_steps(steps, query)

    def run_steps(self, steps: List[dict], query: str = "", url: str = "") -> dict:
        """Execute an ordered list of step dicts in a real browser.

        Returns either:
          - {"already_printed": True} on success (the JSON result was
            already written to stdout as the caller-facing contract), or
          - {"success": False, "error": "..."} if something prevented the
            run from completing (e.g. Playwright missing, no browser found).
        """
        self.log("Initializing Playwright automation runner...")
        steps = self._normalize_steps(list(steps), query, url)

        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            self.log("[Err] Playwright library not found. Run pip3 install playwright.")
            return {
                "success": False,
                "error": "Playwright library is missing. Install using: pip3 install -r sidecars/requirements.txt",
            }

        try:
            with sync_playwright() as p:
                return self._run_with_playwright(p, steps)
        except Exception as e:
            self.log(f"[Err] Automation runner encountered exception: {e}")
            return {"success": False, "error": str(e)}


    def _normalize_steps(self, steps: List[dict], query: str, url: str) -> List[dict]:
        """Apply the same safeguards as before: ensure an initial navigation
        exists when a bare url is supplied, rewrite obviously-hallucinated
        placeholder URLs into a Google search, and guarantee a trailing
        extract step so the caller always gets scraped content back.
        """
        if url and url != "about:blank":
            first_action = steps[0].get("action") if steps else None
            if first_action not in ("navigate", "search"):
                self.log(f"Prepending initial navigation to URL: {url}")
                steps.insert(0, {"action": "navigate", "url": url})

        for step in steps:
            if step.get("action") != "navigate":
                continue
            target = step.get("url") or ""
            if any(marker in target for marker in PLACEHOLDER_URL_MARKERS):
                search_q = query or DEFAULT_SEARCH_QUERY
                self.log(
                    f"Hallucinated/placeholder URL detected: {target}. "
                    f"Rewriting step to Google Search for: '{search_q}'"
                )
                step["action"] = "search"
                step["query"] = search_q

        if not any(s.get("action") == "extract" for s in steps):
            steps.append({"action": "extract"})

        return steps

    def _run_with_playwright(self, p, steps: List[dict]) -> dict:
        session = self._acquire_browser_session(p)
        if session is None:
            return {
                "success": False,
                "error": (
                    "No default system browser found in your system's PATH. "
                    "Please ensure Google Chrome, Edge, or Brave is installed."
                ),
            }
        browser_or_context, context, page, connected_over_cdp = session
        steps = self._self_heal_blank_tab(page, steps)

        self._pages = []
        self._bot_wall_events = []
        self._track_context_pages(context, page)

        active_page = page
        try:
            extracted_content, active_page = self._execute_steps(page, steps)

            result_payload = {
                "success": True,
                "scraped_length": len(extracted_content),
                "snippet": extracted_content.strip() or "No text was extracted.",
                "bot_checks_detected": self._bot_wall_events,
                "final_url": self._safe_get_url(active_page),
            }
            print(json.dumps(result_payload))
            sys.stdout.flush()
            return {"already_printed": True}
        finally:
            # Always attempt cleanup, even if something above raised.
            self._close_session(active_page, browser_or_context, connected_over_cdp)

    def _execute_steps(self, page, steps: List[dict]) -> Tuple[str, Any]:
        extracted_content = ""
        active_page = page

        for index, step in enumerate(steps):
            active_page = self._current_active_page(active_page)

            action = step.get("action")
            self.log(f"Step {index + 1}/{len(steps)}: action={action}")

            handler = self._action_handlers.get(action)
            if handler is None:
                self.log(f"[Warning] Unknown action '{action}', skipping.")
                continue

            try:
                result = handler(active_page, step)
                if action == "extract" and result:
                    extracted_content = result
            except Exception as step_err:
                self.log(f"[Warning] Step '{action}' failed: {step_err}")

        return extracted_content, active_page


    def _acquire_browser_session(self, p) -> Optional[Tuple[Any, Any, Any, bool]]:
        """Attach to an already-running debuggable browser if one exists;
        otherwise launch a new persistent-profile browser.

        Returns (browser_or_context_to_close, context, page, connected_over_cdp),
        or None if no browser executable could be located for a fresh launch.
        """
        cdp_session = self._try_connect_over_cdp(p)
        if cdp_session is not None:
            return cdp_session

        self.log(f"Loading persistent profile from: {self.config.persistent_profile_path}")
        sys_browser = get_system_browser_path()
        if not sys_browser:
            self.log("[Err] No system browser (Chrome/Edge/Brave/Chromium) found in PATH.")
            return None
        self.log(f"Detected system browser path: {sys_browser}")

        browser = self._launch_persistent_browser(
            p, sys_browser, self.config.persistent_profile_path
        )
        page = browser.pages[0] if browser.pages else browser.new_page()
        return browser, page.context, page, False

    def _try_connect_over_cdp(self, p) -> Optional[Tuple[Any, Any, Any, bool]]:
        try:
            self.log(f"Attempting to connect to existing browser session on port {CDP_PORT}...")
            browser = p.chromium.connect_over_cdp(f"http://localhost:{CDP_PORT}")
            self.log("Connected to existing browser session successfully.")

            if browser.contexts:
                context = browser.contexts[0]
                page = context.pages[-1] if context.pages else context.new_page()
                self.log(f"Reusing active browser tab: {page.url}")
            else:
                page = browser.new_page()
            return browser, page.context, page, True
        except Exception as conn_err:
            self.log(f"No existing browser session found. Launching new session... (Detail: {conn_err})")
            return None

    def _launch_persistent_browser(self, p, executable_path: str, profile_dir: str):
        launch_kwargs = dict(
            executable_path=executable_path,
            headless=False,
            args=[f"--remote-debugging-port={CDP_PORT}", "--start-maximized"],
            viewport=None,
        )
        try:
            return p.chromium.launch_persistent_context(user_data_dir=profile_dir, **launch_kwargs)
        except Exception as launch_err:
            err_str = str(launch_err).lower()
            profile_locked = any(
                marker in err_str
                for marker in ("existing browser session", "profile is already in use", "lock")
            )
            if not profile_locked:
                raise RuntimeError(f"Browser launch failed: {launch_err}") from launch_err

            self.log("Profile locked by another instance. Falling back to a temporary profile...")
            temp_dir = tempfile.mkdtemp(prefix="echo-ai-browser-")
            try:
                return p.chromium.launch_persistent_context(user_data_dir=temp_dir, **launch_kwargs)
            except Exception as retry_err:
                raise RuntimeError(f"Browser launch failed: {retry_err}") from retry_err

    def _self_heal_blank_tab(self, page, steps: List[dict]) -> List[dict]:
        """If we ended up on a blank tab with no navigation queued, seed a
        generic search so the run doesn't stall on about:blank.
        """
        is_blank = page.url == "about:blank" or not page.url.startswith("http")
        if not is_blank:
            return steps

        first_action = steps[0].get("action") if steps else None
        if first_action in ("navigate", "search"):
            return steps

        self.log("Browser tab is blank. Prepending Google Search for jobs...")
        return [{"action": "search", "query": "jobs"}] + steps

    def _close_session(self, active_page, browser_or_context, connected_over_cdp: bool) -> None:
        if connected_over_cdp:
            self.log("Browser automation completed on existing session. Tab remains open.")
            return

        self.log("Browser automation completed. Close the browser window/tab to finish the background process.")
        try:
            active_page.wait_for_event("close", timeout=CLOSE_WAIT_TIMEOUT_MS)
        except Exception:
            pass  # timeout or already closed -- proceed to close regardless

        try:
            browser_or_context.close()
            self.log("Browser closed successfully.")
        except Exception as close_err:
            self.log(f"[Warning] Failed to close browser cleanly: {close_err}")


    def _track_context_pages(self, context, initial_page) -> None:
        """Remember every page already open in this context, and keep
        listening for new ones (e.g. an "Apply" link that opens a new tab).
        """
        try:
            self._pages = list(context.pages)
        except Exception:
            self._pages = []
        if initial_page not in self._pages:
            self._pages.append(initial_page)

        try:
            context.on("page", self._on_new_page)
        except Exception:
            pass  # best-effort; if unsupported we simply won't auto-follow popups

    def _on_new_page(self, new_page) -> None:
        self._pages.append(new_page)
        self.log(f"New tab/popup opened: {self._safe_get_url(new_page) or '(loading...)'}")

    def _current_active_page(self, fallback_page):
        """Return the most recently opened, still-open page we know about."""
        for candidate in reversed(self._pages):
            try:
                if not candidate.is_closed():
                    return candidate
            except Exception:
                continue
        return fallback_page

    @staticmethod
    def _safe_get_url(page) -> str:
        try:
            return page.url
        except Exception:
            return ""


    def _detect_bot_wall(self, page) -> Optional[str]:
        """Best-effort check for a CAPTCHA or 'prove you're human' page.
        Returns a short human-readable reason if one looks present.
        """
        try:
            title = (page.title() or "").lower()
        except Exception:
            title = ""
        if any(marker in title for marker in _BOT_WALL_TITLE_MARKERS):
            return f"page title suggests a bot-check: '{title}'"

        try:
            body_snippet = page.locator("body").inner_text()[:2000].lower()
        except Exception:
            body_snippet = ""
        hit = next((m for m in _BOT_WALL_TEXT_MARKERS if m in body_snippet), None)
        if hit:
            return f"page content mentions '{hit}'"

        try:
            for frame in page.frames:
                frame_url = (frame.url or "").lower()
                if any(marker in frame_url for marker in _BOT_WALL_FRAME_URL_MARKERS):
                    return f"detected challenge iframe: {frame_url}"
        except Exception:
            pass

        return None

    def _handle_possible_bot_wall(self, page) -> Optional[str]:
        """If a bot-wall is detected, pause (the window is visible, so a
        human can solve it) and poll until it clears or we give up. Always
        returns the detected reason (even after waiting it out) so the
        caller can flag it, instead of silently proceeding or failing.
        """
        reason = self._detect_bot_wall(page)
        if not reason:
            return None

        self.log(f"[Warning] Possible bot-check / CAPTCHA detected: {reason}")
        self.log(f"Pausing up to {BOT_WALL_MAX_WAIT_S}s in case a human clears it in the visible browser window...")

        waited = 0
        while waited < BOT_WALL_MAX_WAIT_S:
            time.sleep(BOT_WALL_POLL_INTERVAL_S)
            waited += BOT_WALL_POLL_INTERVAL_S
            if not self._detect_bot_wall(page):
                self.log("Bot-check no longer detected, continuing.")
                return None

        self.log("[Warning] Bot-check still present after waiting; continuing anyway and flagging it in the result.")
        return reason

    def _settle_after_navigation(self, page) -> None:
        """After a navigation: give the page a moment to go idle, then check
        for (and wait out) a CAPTCHA/bot-wall before moving on.
        """
        try:
            page.wait_for_load_state("networkidle", timeout=5000)
        except Exception:
            pass 

        reason = self._handle_possible_bot_wall(page)
        if reason:
            self._bot_wall_events.append(f"{self._safe_get_url(page)}: {reason}")

    # -- selector resolution (iframe-aware) ------------------------------

    @staticmethod
    def _build_locator(frame_or_page, selector: str):
        if selector.startswith("text="):
            return frame_or_page.get_by_text(selector[len("text="):], exact=False).first
        return frame_or_page.locator(selector).first

    def _resolve_locator_across_frames(self, page, selector: str):
        """Find `selector` in the main frame first, then fall back to
        searching every child iframe (application forms, embedded search
        widgets, etc. often live inside one). Falls back to the plain
        main-frame locator if nothing matches, so callers still get
        Playwright's normal, descriptive timeout error.
        """
        main_locator = self._build_locator(page, selector)
        try:
            if main_locator.count() > 0:
                return main_locator
        except Exception:
            pass

        try:
            child_frames = page.frames[1:]  # frames[0] is the main frame
        except Exception:
            child_frames = []

        for frame in child_frames:
            try:
                candidate = self._build_locator(frame, selector)
                if candidate.count() > 0:
                    self.log(f"Selector '{selector}' found inside iframe: {frame.url}")
                    return candidate
            except Exception:
                continue

        return main_locator

    # -- step handlers ----------------------------------------------------

    def _do_navigate(self, page, step: dict) -> None:
        target = step.get("url")
        self.log(f"Navigating to: {target}")
        self._goto_with_retry(page, target)
        self._settle_after_navigation(page)

    def _do_search(self, page, step: dict) -> None:
        q = step.get("query", "")
        self.log(f"Searching Google for: {q}")
        target = f"https://www.google.com/search?q={quote_plus(q)}"
        self._goto_with_retry(page, target)
        self._settle_after_navigation(page)

    def _goto_with_retry(self, page, target_url: str) -> None:
        """Navigate with one retry using a lighter wait condition, so a slow
        (but not dead) page doesn't fail the whole step outright.
        """
        try:
            page.goto(target_url, wait_until="load", timeout=NAV_TIMEOUT_MS)
        except Exception as first_err:
            self.log(f"[Warning] Navigation with wait_until='load' failed ({first_err}); retrying with 'domcontentloaded'...")
            page.goto(target_url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)

    def _do_click(self, page, step: dict) -> None:
        selector = step.get("selector") or ""
        self.log(f"Clicking selector: {selector}")
        locator = self._resolve_locator_across_frames(page, selector)
        try:
            locator.scroll_into_view_if_needed(timeout=ACTION_TIMEOUT_MS)
        except Exception:
            pass  # best-effort; some elements can't be scrolled, click anyway
        locator.click(timeout=ACTION_TIMEOUT_MS)

    def _do_type(self, page, step: dict) -> None:
        selector = step.get("selector") or ""
        text = step.get("text", "")
        self.log(f"Typing '{text}' into: {selector}")
        locator = self._resolve_locator_across_frames(page, selector)
        locator.fill(text, timeout=ACTION_TIMEOUT_MS)

    def _do_wait_for(self, page, step: dict) -> None:
        """Wait for a selector to reach a given state instead of guessing
        a fixed sleep. state: visible|attached|hidden|detached.
        """
        selector = step.get("selector") or ""
        state = step.get("state", "visible")
        timeout = step.get("timeout_ms", NAV_TIMEOUT_MS)
        self.log(f"Waiting for selector '{selector}' (state={state}, timeout={timeout}ms)...")
        locator = self._resolve_locator_across_frames(page, selector)
        locator.wait_for(state=state, timeout=timeout)

    def _do_wait_for_load(self, page, step: dict) -> None:
        """Wait for a page load state (e.g. 'networkidle') rather than a
        fixed sleep -- useful after actions that trigger client-side
        navigation or a burst of API calls (job board search results, etc.).
        """
        state = step.get("state", "networkidle")
        timeout = step.get("timeout_ms", NAV_TIMEOUT_MS)
        self.log(f"Waiting for load state '{state}' (timeout={timeout}ms)...")
        try:
            page.wait_for_load_state(state, timeout=timeout)
        except Exception as e:
            self.log(f"[Warning] wait_for_load_state('{state}') timed out or failed: {e}")

    def _do_upload(self, page, step: dict) -> None:
        """Attach local file(s) to a file input -- e.g. uploading a resume
        during a job application. `paths` may be a single path or a list.
        """
        selector = step.get("selector") or ""
        paths = step.get("paths", step.get("path"))
        if isinstance(paths, str):
            paths = [paths]
        self.log(f"Uploading {paths} to: {selector}")
        locator = self._resolve_locator_across_frames(page, selector)
        locator.set_input_files(paths, timeout=ACTION_TIMEOUT_MS)

    def _do_scroll(self, page, step: dict) -> None:
        """Scroll up/down. When scrolling down, stops early once the page
        stops growing (handles both fixed-length and infinite-scroll pages
        without needing a large hardcoded count).
        """
        direction = step.get("direction", "down")
        count = step.get("count", 1)
        pause_ms = step.get("pause_ms", 500)
        self.log(f"Scrolling {direction} (x{count})...")
        delta_expr = (
            "window.innerHeight * 0.75" if direction == "down" else "-(window.innerHeight * 0.75)"
        )

        for i in range(count):
            prev_height = self._safe_scroll_height(page)
            page.evaluate(f"window.scrollBy(0, {delta_expr})")
            time.sleep(pause_ms / 1000)

            if direction == "down" and i > 0:
                new_height = self._safe_scroll_height(page)
                if new_height is not None and prev_height is not None and new_height <= prev_height:
                    self.log("No new content loaded after scrolling further; stopping early.")
                    break

    @staticmethod
    def _safe_scroll_height(page) -> Optional[int]:
        try:
            return page.evaluate("document.body.scrollHeight")
        except Exception:
            return None

    def _do_wait(self, page, step: dict) -> None:
        seconds = step.get("seconds", 2)
        self.log(f"Waiting {seconds}s...")
        time.sleep(seconds)

    def _do_screenshot(self, page, step: dict) -> None:
        filename = step.get("filename", "screenshot.png")
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, "../../../"))
        screenshots_dir = os.path.join(project_root, "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)

        target_path = os.path.join(screenshots_dir, os.path.basename(filename))
        self.log(f"Taking page screenshot and saving to: {target_path}")
        try:
            page.screenshot(path=target_path)
        except Exception as ss_err:
            self.log(f"[Warning] Failed to take screenshot: {ss_err}")

    def _do_extract(self, page, step: dict) -> str:
        self.log("Extracting webpage text and interactive elements...")
        body_text = page.locator("body").inner_text()

        try:
            interactive_elements = page.evaluate(_EXTRACT_INTERACTIVE_JS)
        except Exception as eval_err:
            interactive_elements = f"Error extracting interactive elements: {eval_err}"

        return (
            f"{body_text[:MAX_EXTRACT_CHARS]}\n\n"
            f"=== INTERACTIVE ELEMENTS & SELECTORS ON THIS PAGE ===\n"
            f"{interactive_elements}"
        )


if __name__ == "__main__":
    # Minimal smoke test for manual, cross-platform sanity checks:
    #   python runner.py "https://example.com" "test query"
    test_url = sys.argv[1] if len(sys.argv) > 1 else "https://www.google.com"
    test_query = sys.argv[2] if len(sys.argv) > 2 else "test query"
    runner = BrowserRunner()
    outcome = runner.run(test_url, test_query)
    if outcome != {"already_printed": True}:
        print(json.dumps(outcome))