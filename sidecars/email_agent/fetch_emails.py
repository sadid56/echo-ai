import imaplib
import email
from email.header import decode_header
import json
import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="Fetch emails via secure IMAP")
    parser.add_argument("--server", default="", help="IMAP Server")
    parser.add_argument("--email", default="", help="Email address")
    parser.add_argument("--password", default="", help="App Password")
    parser.add_argument("--filter", default="UNSEEN", help="Search filter (UNSEEN, FLAGGED, ALL)")
    parser.add_argument("--limit", type=int, default=5, help="Limit output")
    parser.add_argument("--query", default="", help="Search query (e.g. sender, subject, or body keyword)")

    args = parser.parse_args()

    # Trigger offline simulated mode if credentials are placeholders or empty
    is_mock = (
        not args.server or 
        not args.email or 
        not args.password or 
        "placeholder" in args.email.lower() or 
        "password" in args.password.lower() or
        args.email == ""
    )

    if is_mock:
        print("[LOG] Email credentials not fully configured. Running in simulated offline sandbox.")
        sys.stdout.flush()
        
        mock_emails = []
        if args.filter == "UNSEEN" or args.filter == "ALL":
            mock_emails.append({
                "id": "100",
                "from": "Google Workspace Team <workspace-noreply@google.com>",
                "subject": "Security alert for your connected developer console",
                "date": "Sun, 09 Aug 2026 12:45:00 +0600",
                "snippet": "We noticed a new login to your Google Cloud Console from Mac Mini on macOS. If this was you, no action is needed..."
            })
            mock_emails.append({
                "id": "101",
                "from": "CEO <ceo@echo-corp.ai>",
                "subject": "Urgent: Project Launch Timeline & LTS requirements",
                "date": "Sun, 09 Aug 2026 11:20:00 +0600",
                "snippet": "Hi Team, we need to ensure the rollout checklist and verification steps are complete before the release window..."
            })
        if args.filter == "FLAGGED" or args.filter == "ALL":
            mock_emails.append({
                "id": "102",
                "from": "GitHub Notifications <noreply@github.com>",
                "subject": "[GitHub] Critical Security Vulnerability found in willro-monorepo dependency",
                "date": "Sun, 09 Aug 2026 09:15:00 +0600",
                "snippet": "We identified a vulnerability in one of your packages. Please review the security tab to upgrade typescript..."
            })

        if args.query:
            q = args.query.lower()
            mock_emails = [
                m for m in mock_emails
                if q in m["from"].lower() or q in m["subject"].lower() or q in m["snippet"].lower()
            ]

        print(json.dumps({"success": True, "emails": mock_emails}))
        sys.stdout.flush()
        return

    try:
        print(f"[LOG] Connecting to secure IMAP server: {args.server}...")
        sys.stdout.flush()
        mail = imaplib.IMAP4_SSL(args.server)
        mail.login(args.email, args.password)
        mail.select("inbox")

        # Map filters and criteria
        criteria = []
        if args.filter == "FLAGGED":
            criteria.append("FLAGGED")
        elif args.filter == "ALL":
            criteria.append("ALL")
        else:
            criteria.append("UNSEEN")

        if args.query:
            criteria.extend(["TEXT", f'"{args.query}"'])

        print(f"[LOG] Searching inbox with criteria: {criteria}...")
        sys.stdout.flush()
        status, messages = mail.search(None, *criteria)
        if status != "OK":
            print(json.dumps({"success": False, "error": f"Search failed: {status}"}))
            return

        mail_ids = messages[0].split()
        latest_ids = mail_ids[-args.limit:]
        latest_ids.reverse() # Newest first

        results = []
        for m_id in latest_ids:
            res_status, msg_data = mail.fetch(m_id, "(RFC822)")
            if res_status != "OK":
                continue

            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    
                    # Parse subject
                    subject = ""
                    if msg["Subject"]:
                        subject_header = decode_header(msg["Subject"])[0]
                        subject = subject_header[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(subject_header[1] or "utf-8", errors="ignore")
                    
                    # Parse sender
                    from_header = ""
                    if msg["From"]:
                        from_parsed = decode_header(msg["From"])[0]
                        from_header = from_parsed[0]
                        if isinstance(from_header, bytes):
                            from_header = from_header.decode(from_parsed[1] or "utf-8", errors="ignore")

                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            content_disposition = str(part.get("Content-Disposition"))
                            if content_type == "text/plain" and "attachment" not in content_disposition:
                                body_bytes = part.get_payload(decode=True)
                                if body_bytes:
                                    body = body_bytes.decode(errors="ignore")
                                break
                    else:
                        body_bytes = msg.get_payload(decode=True)
                        if body_bytes:
                            body = body_bytes.decode(errors="ignore")

                    snippet = body.strip()[:200].replace("\n", " ").replace("\r", "")
                    results.append({
                        "id": m_id.decode(),
                        "from": from_header,
                        "subject": subject,
                        "date": msg["Date"],
                        "snippet": snippet
                    })

        mail.logout()
        print(json.dumps({"success": True, "emails": results}))
        sys.stdout.flush()

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.stdout.flush()

if __name__ == "__main__":
    main()
