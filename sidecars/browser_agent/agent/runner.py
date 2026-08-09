import sys
import time
import os
import json
from agent.config import AgentConfig

class BrowserRunner:
    def __init__(self):
        self.config = AgentConfig()
        
    def log(self, message: str):
        try:
            print(f"[LOG] {message}")
            sys.stdout.flush()
        except BrokenPipeError:
            pass
        except Exception:
            pass

    def run(self, url: str, query: str) -> dict:
        # Fallback to run_steps with a default script if simple call is made
        steps = [
            {"action": "navigate", "url": url},
            {"action": "wait", "seconds": 2},
            {"action": "extract"}
        ]
        return self.run_steps(steps, query)

    def run_steps(self, steps: list, query: str = "", url: str = "") -> dict:
        self.log(f"Initializing Playwright automation runner...")
        
        # Safeguard: if an initial URL is passed but the steps lack any navigation, prepend navigation
        if url and url != "about:blank":
            has_nav_first = False
            if steps:
                first_act = steps[0].get("action")
                if first_act in ["navigate", "search"]:
                    has_nav_first = True
            if not has_nav_first:
                self.log(f"[LOG] Prepending initial navigation to URL: {url}")
                steps.insert(0, {"action": "navigate", "url": url})

        # Safeguard: Intercept placeholder/fake domains and rewrite them to Google Search
        for step in steps:
            if step.get("action") == "navigate":
                target_url = step.get("url", "")
                if "example" in target_url or "jobboard" in target_url or "placeholder" in target_url or "fake" in target_url:
                    search_q = query if query else "React developer jobs in Bangladesh"
                    self.log(f"[LOG] Hallucinated/Placeholder URL detected: {target_url}. Rewriting step to Google Search for: '{search_q}'")
                    step["action"] = "search"
                    step["query"] = search_q
        
        # Auto-append extract step to guarantee results are returned to the AI
        has_extract = any(s.get("action") == "extract" for s in steps)
        if not has_extract:
            steps.append({"action": "extract"})
            
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            self.log("[Err] Playwright library not found. Run pip3 install playwright.")
            return {
                "success": False,
                "error": "Playwright library is missing. Install using: pip3 install -r sidecars/browser_agent/requirements.txt"
            }

        try:
            with sync_playwright() as p:
                browser = None
                page = None
                connected_over_cdp = False
                
                # 1. Try to connect to an existing debugging session on port 9222
                try:
                    self.log("Attempting to connect to existing browser session on port 9222...")
                    browser = p.chromium.connect_over_cdp("http://localhost:9222")
                    connected_over_cdp = True
                    self.log("Connected to existing browser session successfully.")
                    if browser.contexts:
                        context = browser.contexts[0]
                        if context.pages:
                            page = context.pages[-1]
                            self.log(f"Reusing active browser tab: {page.url}")
                        else:
                            page = context.new_page()
                    else:
                        page = browser.new_page()
                except Exception as conn_err:
                    self.log(f"No existing browser session found. Launching new session... (Detail: {conn_err})")

                # 2. Fallback to launching a new persistent browser context on port 9222
                if not connected_over_cdp:
                    self.log(f"Loading persistent profile from: {self.config.persistent_profile_path}")
                    try:
                        browser = p.chromium.launch_persistent_context(
                            user_data_dir=self.config.persistent_profile_path,
                            headless=False,
                            args=["--remote-debugging-port=9222"],
                            viewport={"width": 1280, "height": 720}
                        )
                    except Exception as launch_err:
                        err_str = str(launch_err).lower()
                        if "existing browser session" in err_str or "profile is already in use" in err_str or "lock" in err_str:
                            self.log("[LOG] Profile locked by another instance. Falling back to temporary context...")
                            import tempfile
                            temp_dir = tempfile.mkdtemp(prefix="echo-ai-browser-")
                            browser = p.chromium.launch_persistent_context(
                                user_data_dir=temp_dir,
                                headless=False,
                                args=["--remote-debugging-port=9222"],
                                viewport={"width": 1280, "height": 720}
                            )
                        else:
                            self.log(f"[Err] Failed to launch browser: {launch_err}")
                            return {
                                "success": False,
                                "error": f"Browser launch failed: {launch_err}"
                            }
                    page = browser.pages[0] if browser.pages else browser.new_page()

                # Self-heal: if browser tab is blank and steps have no navigation, prepend Google search
                is_blank = page.url == "about:blank" or not page.url.startswith("http")
                if is_blank:
                    has_nav = False
                    if steps:
                        first_act = steps[0].get("action")
                        if first_act in ["navigate", "search"]:
                            has_nav = True
                    if not has_nav:
                        self.log("[LOG] Browser tab is blank. Prepending Google Search for jobs...")
                        steps.insert(0, {"action": "search", "query": "jobs"})

                extracted_content = ""
                
                for index, step in enumerate(steps):
                    action = step.get("action")
                    self.log(f"Step {index+1}/{len(steps)}: Action = {action}")
                    
                    try:
                        if action == "navigate":
                            url = step.get("url")
                            self.log(f"Navigating to: {url}")
                            page.goto(url, wait_until="load", timeout=15000)
                            
                        elif action == "search":
                            query = step.get("query", "")
                            self.log(f"Searching Google for: {query}")
                            url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
                            page.goto(url, wait_until="load", timeout=15000)

                        elif action == "click":
                            selector = step.get("selector")
                            self.log(f"Clicking selector: {selector}")
                            if selector.startswith("text="):
                                text_val = selector[5:]
                                page.locator(f"text={text_val}").first.click(timeout=8000)
                            else:
                                page.locator(selector).first.click(timeout=8000)
                                
                        elif action == "type":
                            selector = step.get("selector")
                            text = step.get("text")
                            self.log(f"Typing '{text}' into: {selector}")
                            page.locator(selector).first.fill(text, timeout=8000)
                            
                        elif action == "scroll":
                            direction = step.get("direction", "down")
                            count = step.get("count", 1)
                            self.log(f"Scrolling {direction} (x{count})...")
                            for _ in range(count):
                                if direction == "down":
                                    page.evaluate("window.scrollBy(0, window.innerHeight * 0.75)")
                                else:
                                    page.evaluate("window.scrollBy(0, -window.innerHeight * 0.75)")
                                time.sleep(0.5)
                                
                        elif action == "wait":
                            seconds = step.get("seconds", 2)
                            self.log(f"Waiting {seconds}s...")
                            time.sleep(seconds)
                            
                        elif action == "extract":
                            self.log("Extracting webpage text...")
                            body_text = page.locator("body").inner_text()
                            extracted_content = body_text[:4000]
                            
                    except Exception as step_err:
                        self.log(f"[Warning] Step failed: {step_err}")
                
                # Output the final JSON string first so Rust can capture it and return early
                result_payload = {
                    "success": True,
                    "scraped_length": len(extracted_content),
                    "snippet": extracted_content.strip() or "No text was extracted."
                }
                print(json.dumps(result_payload))
                sys.stdout.flush()

                if connected_over_cdp:
                    self.log("Browser automation completed on existing session. Tab remains open.")
                else:
                    self.log("Browser automation completed. Close the browser window/tab to finish the background process.")
                    try:
                        # Wait up to 15 minutes (900s) for the user to close the window
                        page.wait_for_event("close", timeout=900000)
                    except Exception:
                        pass
                    browser.close()
                    self.log("Browser closed successfully.")
                
                return {
                    "already_printed": True
                }
                
        except Exception as e:
            self.log(f"[Err] Automation runner encountered exception: {e}")
            return {
                "success": False,
                "error": str(e)
            }
