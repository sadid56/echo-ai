"""
fetch_emails.py

Fetches real email over secure IMAP based on flexible search criteria
(unread/flagged/date range/sender/subject/free-text) and returns a single
JSON result on stdout.

Design goals for this version:
  - NEVER returns simulated/placeholder/mock emails. If credentials are
    missing or invalid, it returns a clear structured error instead of
    fabricated data, so a caller (human or AI) can never mistake fake
    output for a real inbox.
  - Every failure mode (missing credentials, DNS/connection failure,
    timeout, bad login, missing folder, bad search, per-message fetch
    issues) is reported with a distinct "error_type" and a specific,
    actionable "error" message -- not a generic exception dump.
  - Fetching a message never marks it as read as a side effect (uses
    IMAP's BODY.PEEK[]); pass --mark-read if you explicitly want that.
  - Supports combining filters: --filter (flag state) + --query
    (free text) + --from-addr + --subject + --since/--before (date range),
    all AND-ed together, across any folder via --folder.

Output contract (JSON, one line, always printed):
  Success : {"success": true, "emails": [...], "total_matched": N, "returned": N}
  No hits : {"success": true, "emails": [], "total_matched": 0, "message": "..."}
  Failure : {"success": false, "error_type": "...", "error": "..."}
"""

import argparse
import imaplib
import json
import re
import socket
import sys
from datetime import datetime
from email import message_from_bytes
from email.header import decode_header
from typing import List, Optional, Tuple

DEFAULT_IMAP_PORT = 993
DEFAULT_TIMEOUT_S = 20

VALID_FILTERS = {"UNSEEN", "SEEN", "FLAGGED", "UNFLAGGED", "ANSWERED", "UNANSWERED", "ALL"}

# Common providers that silently reject a normal password over IMAP and
_PROVIDER_AUTH_HINTS = {
    "gmail.com": (
        "Gmail requires IMAP enabled (Settings > Forwarding and POP/IMAP) and an "
        "App Password from https://myaccount.google.com/apppasswords -- your normal "
        "Google password will not work here."
    ),
    "outlook.com": (
        "Outlook/Hotmail requires an App Password if 2-factor auth is enabled: "
        "https://account.live.com/proofs/AppPassword"
    ),
    "hotmail.com": (
        "Outlook/Hotmail requires an App Password if 2-factor auth is enabled: "
        "https://account.live.com/proofs/AppPassword"
    ),
    "live.com": (
        "Outlook/Hotmail requires an App Password if 2-factor auth is enabled: "
        "https://account.live.com/proofs/AppPassword"
    ),
    "yahoo.com": (
        "Yahoo requires an App Password from https://login.yahoo.com/account/security "
        "-- your normal Yahoo password will not work here."
    ),
}



def emit(payload: dict) -> None:
    print(json.dumps(payload))
    sys.stdout.flush()


def log(message: str) -> None:
    print(f"[LOG] {message}")
    sys.stdout.flush()


def fail(error_type: str, message: str, **extra) -> None:
    payload = {"success": False, "error_type": error_type, "error": message}
    payload.update(extra)
    emit(payload)


def provider_hint(email_addr: str) -> str:
    domain = email_addr.rsplit("@", 1)[-1].lower() if "@" in email_addr else ""
    return _PROVIDER_AUTH_HINTS.get(domain, "")



def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch real emails via secure IMAP. Never returns simulated data."
    )
    parser.add_argument("--server", default="", help="IMAP server hostname, e.g. imap.gmail.com")
    parser.add_argument("--port", type=int, default=DEFAULT_IMAP_PORT, help="IMAP SSL port (default 993)")
    parser.add_argument("--email", default="", help="Email address / IMAP username")
    parser.add_argument("--password", default="", help="IMAP password / app password")
    parser.add_argument("--folder", default="INBOX", help="Mailbox/folder to search (default INBOX)")
    parser.add_argument(
        "--filter", default="UNSEEN", choices=sorted(VALID_FILTERS),
        help="IMAP flag filter: UNSEEN, SEEN, FLAGGED, UNFLAGGED, ANSWERED, UNANSWERED, ALL",
    )
    parser.add_argument("--query", default="", help="Free-text search across subject/body/from")
    parser.add_argument("--from-addr", dest="from_addr", default="", help="Filter by sender name/address")
    parser.add_argument("--subject", default="", help="Filter by subject text")
    parser.add_argument("--since", default="", help="Only messages on/after this date, YYYY-MM-DD")
    parser.add_argument("--before", default="", help="Only messages before this date, YYYY-MM-DD")
    parser.add_argument("--limit", type=int, default=5, help="Max number of emails to return")
    parser.add_argument(
        "--mark-read", action="store_true", dest="mark_read",
        help="Mark fetched messages as read (default: leave unread, non-destructive)",
    )
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT_S, help="Socket timeout in seconds")
    return parser.parse_args(argv)


def validate_args(args: argparse.Namespace) -> Optional[Tuple[str, str]]:
    """Returns (error_type, error_message) if args are invalid, else None."""
    missing = [flag for flag, val in (
        ("--server", args.server), ("--email", args.email), ("--password", args.password),
    ) if not val]
    if missing:
        return (
            "missing_credentials",
            f"Missing required argument(s): {', '.join(missing)}. All three must be provided "
            f"to fetch real email -- this tool never returns simulated/placeholder data.",
        )

    if args.limit < 1:
        return ("invalid_argument", f"--limit must be at least 1, got: {args.limit}")

    if args.port < 1 or args.port > 65535:
        return ("invalid_argument", f"--port must be between 1 and 65535, got: {args.port}")

    return None



def decode_mime_words(raw: Optional[str]) -> str:
    """Decode a MIME-encoded header (Subject/From) into a plain string,
    joining every encoded-word part -- not just the first one.
    """
    if not raw:
        return ""
    decoded_parts = []
    for value, charset in decode_header(raw):
        if isinstance(value, bytes):
            try:
                decoded_parts.append(value.decode(charset or "utf-8", errors="ignore"))
            except (LookupError, TypeError):
                decoded_parts.append(value.decode("utf-8", errors="ignore"))
        else:
            decoded_parts.append(value)
    return "".join(decoded_parts)


def _strip_html_tags(html: str) -> str:
    no_scripts = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.IGNORECASE | re.DOTALL)
    no_tags = re.sub(r"<[^>]+>", " ", no_scripts)
    return re.sub(r"\s+", " ", no_tags).strip()


def extract_body(msg) -> str:
    """Prefer text/plain; fall back to text/html (tags stripped) if that's
    all the message has. Handles nested multipart parts and skips
    attachments correctly.
    """
    plain_text = None
    html_text = None

    if msg.is_multipart():
        for part in msg.walk():
            if part.is_multipart():
                continue
            content_type = part.get_content_type()
            disposition = (part.get("Content-Disposition") or "").lower()
            if "attachment" in disposition:
                continue

            payload = part.get_payload(decode=True)
            if not payload:
                continue

            charset = part.get_content_charset() or "utf-8"
            try:
                text = payload.decode(charset, errors="ignore")
            except (LookupError, TypeError):
                text = payload.decode("utf-8", errors="ignore")

            if content_type == "text/plain" and plain_text is None:
                plain_text = text
            elif content_type == "text/html" and html_text is None:
                html_text = text
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            try:
                text = payload.decode(charset, errors="ignore")
            except (LookupError, TypeError):
                text = payload.decode("utf-8", errors="ignore")
            if msg.get_content_type() == "text/html":
                html_text = text
            else:
                plain_text = text

    if plain_text is not None:
        return plain_text
    if html_text is not None:
        return _strip_html_tags(html_text)
    return ""



def quote_imap_literal(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def to_imap_date(date_str: str, flag_name: str) -> str:
    """Convert YYYY-MM-DD to IMAP's DD-Mon-YYYY format."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise ValueError(f"{flag_name} must be in YYYY-MM-DD format, got: '{date_str}'")
    return dt.strftime("%d-%b-%Y")


def build_search_criteria(args: argparse.Namespace) -> List[str]:
    """Combine the flag filter with any of query/from/subject/since/before.
    All conditions are AND-ed together by IMAP SEARCH semantics.
    """
    criteria = [args.filter]

    if args.query:
        criteria += ["TEXT", quote_imap_literal(args.query)]
    if args.from_addr:
        criteria += ["FROM", quote_imap_literal(args.from_addr)]
    if args.subject:
        criteria += ["SUBJECT", quote_imap_literal(args.subject)]
    if args.since:
        criteria += ["SINCE", to_imap_date(args.since, "--since")]
    if args.before:
        criteria += ["BEFORE", to_imap_date(args.before, "--before")]

    return criteria


# -- IMAP connection / selection / search / fetch 

def connect(args: argparse.Namespace):
    """Returns (mail, error_type, error_message). mail is None on failure."""
    socket.setdefaulttimeout(args.timeout)

    try:
        mail = imaplib.IMAP4_SSL(args.server, args.port)
    except socket.gaierror as e:
        return None, "connection_failed", f"Could not resolve IMAP server '{args.server}': {e}"
    except (socket.timeout, TimeoutError):
        return None, "timeout", f"Connection to '{args.server}:{args.port}' timed out after {args.timeout}s."
    except (ConnectionRefusedError, OSError) as e:
        return None, "connection_failed", f"Could not connect to '{args.server}:{args.port}': {e}"
    except Exception as e:
        return None, "connection_failed", f"Unexpected error connecting to IMAP server: {e}"

    try:
        mail.login(args.email, args.password)
    except imaplib.IMAP4.error as e:
        try:
            mail.logout()
        except Exception:
            pass
        message = f"IMAP login failed for '{args.email}': {e}"
        hint = provider_hint(args.email)
        if hint:
            message += f" Hint: {hint}"
        return None, "auth_failed", message
    except Exception as e:
        return None, "auth_failed", f"Unexpected error during IMAP login: {e}"

    return mail, None, None


def select_folder(mail, folder: str) -> Optional[Tuple[str, str]]:
    try:
        status, data = mail.select(folder)
    except Exception as e:
        return "folder_not_found", f"Could not open folder '{folder}': {e}"
    if status != "OK":
        detail = data[0].decode(errors="ignore") if data and data[0] else status
        return "folder_not_found", f"Folder '{folder}' not found or inaccessible: {detail}"
    return None


def search_messages(mail, criteria: List[str]) -> Tuple[Optional[list], Optional[str], Optional[str]]:
    try:
        status, data = mail.search("UTF-8", *criteria)
    except imaplib.IMAP4.error:
        status, data = None, None

    if status != "OK":
        try:
            status, data = mail.search(None, *criteria)
        except imaplib.IMAP4.error as e:
            return None, "search_failed", f"IMAP search failed with criteria {criteria}: {e}"
        except Exception as e:
            return None, "search_failed", f"Unexpected error during IMAP search: {e}"

    if status != "OK":
        return None, "search_failed", f"IMAP search returned status '{status}' for criteria: {criteria}"

    ids = data[0].split() if data and data[0] else []
    return ids, None, None


def fetch_message(mail, m_id: bytes, mark_read: bool) -> Tuple[Optional[dict], Optional[str]]:
    """Fetch one message non-destructively (BODY.PEEK[] never sets \\Seen),
    then explicitly mark it read afterward only if requested.
    """
    id_str = m_id.decode(errors="ignore")
    try:
        status, msg_data = mail.fetch(m_id, "(BODY.PEEK[])")
    except Exception as e:
        return None, f"fetch failed for id {id_str}: {e}"

    if status != "OK" or not msg_data:
        return None, f"fetch returned status '{status}' for id {id_str}"

    raw_bytes = next((part[1] for part in msg_data if isinstance(part, tuple)), None)
    if raw_bytes is None:
        return None, f"no message body returned for id {id_str}"

    msg = message_from_bytes(raw_bytes)

    if mark_read:
        try:
            mail.store(m_id, "+FLAGS", "\\Seen")
        except Exception:
            pass 

    subject = decode_mime_words(msg.get("Subject", ""))
    from_header = decode_mime_words(msg.get("From", ""))
    body = extract_body(msg)
    snippet = re.sub(r"\s+", " ", body).strip()[:200]

    return {
        "id": id_str,
        "from": from_header,
        "subject": subject,
        "date": msg.get("Date", ""),
        "snippet": snippet,
    }, None


# -- main 

def main() -> None:
    args = parse_args()

    validation_error = validate_args(args)
    if validation_error:
        fail(*validation_error)
        return

    log(f"Connecting to secure IMAP server: {args.server}:{args.port}...")
    mail, error_type, error_message = connect(args)
    if mail is None:
        fail(error_type, error_message)
        return

    try:
        log(f"Opening folder: {args.folder}...")
        folder_error = select_folder(mail, args.folder)
        if folder_error:
            fail(*folder_error)
            return

        try:
            criteria = build_search_criteria(args)
        except ValueError as e:
            fail("invalid_argument", str(e))
            return

        log(f"Searching with criteria: {criteria}...")
        ids, error_type, error_message = search_messages(mail, criteria)
        if error_type:
            fail(error_type, error_message)
            return

        total_matched = len(ids)
        if total_matched == 0:
            emit({
                "success": True,
                "emails": [],
                "total_matched": 0,
                "message": "No emails matched the given filter/search criteria.",
            })
            return

        target_ids = list(reversed(ids))[: args.limit]

        results = []
        warnings = []
        for m_id in target_ids:
            record, warning = fetch_message(mail, m_id, args.mark_read)
            if record:
                results.append(record)
            if warning:
                warnings.append(warning)

        payload = {
            "success": True,
            "emails": results,
            "total_matched": total_matched,
            "returned": len(results),
        }
        if warnings:
            payload["warnings"] = warnings
        emit(payload)

    finally:
        try:
            mail.logout()
        except Exception:
            pass


if __name__ == "__main__":
    main()