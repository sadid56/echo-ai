import sys
import os
import json
import asyncio
import subprocess

# Self-heal dependencies
try:
    from telethon import TelegramClient, utils
    from telethon.errors import SessionPasswordNeededError
except ImportError:
    print("STATUS:INSTALLING_TELETHON", flush=True)
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "telethon"])
        from telethon import TelegramClient, utils
        from telethon.errors import SessionPasswordNeededError
    except Exception as e:
        print(f"ERROR:Failed to install telethon: {e}", flush=True)
        sys.exit(1)

# Helpers for reading stdin
async def read_stdin_line():
    loop = asyncio.get_event_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)
    line = await reader.readline()
    return line.decode().strip()

async def main():
    if len(sys.argv) < 4:
        print("ERROR:Missing arguments. Usage: python telegram_user_agent.py <api_id> <api_hash> <phone>", flush=True)
        sys.exit(1)

    api_id = int(sys.argv[1])
    api_hash = sys.argv[2]
    phone = sys.argv[3]

    session_path = os.path.join(os.path.dirname(__file__), "telegram_user")
    
    client = TelegramClient(session_path, api_id, api_hash)
    await client.connect()

    if not await client.is_user_authorized():
        print("STATUS:AUTH_REQUIRED", flush=True)
        # Request code
        await client.send_code_request(phone)
        
        # Wait for code from stdin
        # Expected format: CODE:12345
        code_line = await read_stdin_line()
        if not code_line.startswith("CODE:"):
            print("ERROR:Expected code input in format CODE:xxxxx", flush=True)
            sys.exit(1)
        
        code = code_line[5:].strip()
        try:
            await client.sign_in(phone, code)
        except SessionPasswordNeededError:
            print("STATUS:PASSWORD_REQUIRED", flush=True)
            # Wait for password from stdin
            # Expected format: PASSWORD:xxxx
            pwd_line = await read_stdin_line()
            if not pwd_line.startswith("PASSWORD:"):
                print("ERROR:Expected password in format PASSWORD:xxxxx", flush=True)
                sys.exit(1)
            password = pwd_line[9:].strip()
            await client.sign_in(password=password)
        except Exception as e:
            print(f"ERROR:Authentication failed: {e}", flush=True)
            sys.exit(1)

    print("STATUS:CONNECTED", flush=True)

    # Check if a single command was passed as a command line argument (e.g. GET_CHATS or SEND_MESSAGE:12345:hello)
    single_command = None
    if len(sys.argv) >= 5:
        single_command = sys.argv[4]

    # Main command loop / Single command runner
    is_running = True
    while is_running:
        try:
            if single_command:
                line = single_command
                is_running = False  # Exit after processing this command
            else:
                line = await read_stdin_line()
                if not line:
                    await asyncio.sleep(0.5)
                    continue
                
            if line == "EXIT":
                break
            elif line == "GET_CHATS":
                chats = []
                async for dialog in client.iter_dialogs(limit=15):
                    chat_type = "user"
                    if dialog.is_group:
                        chat_type = "group"
                    elif dialog.is_channel:
                        chat_type = "channel"

                    last_msg = ""
                    if dialog.message and dialog.message.text:
                        last_msg = dialog.message.text[:60]

                    chats.append({
                        "id": dialog.id,
                        "name": dialog.name,
                        "unread_count": dialog.unread_count,
                        "type": chat_type,
                        "last_message": last_msg
                    })
                print("CHATS:" + json.dumps(chats), flush=True)
            elif line.startswith("GET_MESSAGES:"):
                # GET_MESSAGES:chat_id:limit
                parts = line.split(":")
                chat_id = int(parts[1])
                limit = int(parts[2]) if len(parts) > 2 else 10

                messages = []
                async for msg in client.iter_messages(chat_id, limit=limit):
                    sender_name = "System"
                    sender = await msg.get_sender()
                    if sender:
                        sender_name = utils.get_display_name(sender)

                    messages.append({
                        "id": msg.id,
                        "sender": sender_name,
                        "text": msg.text or "[Media/Attachment]",
                        "date": msg.date.strftime("%Y-%m-%d %H:%M:%S")
                    })
                print("MESSAGES:" + json.dumps(messages), flush=True)
            elif line.startswith("SEND_MESSAGE:"):
                # SEND_MESSAGE:chat_id:text
                parts = line.split(":", 2)
                chat_id = int(parts[1])
                text = parts[2]
                
                await client.send_message(chat_id, text)
                print("SEND_SUCCESS", flush=True)
        except Exception as e:
            print(f"ERROR:Command failed: {e}", flush=True)

    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
