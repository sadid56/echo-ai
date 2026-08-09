# Echo AI - Enterprise Assistant Workspace

Echo AI is an autonomous, multi-model AI desktop workspace built using **Tauri (Rust Core)**, **React (TypeScript Frontend)**, and **Python Automation Sidecars**. 

It implements the **Provider Abstraction Pattern**, allowing you to swap active AI models (Gemini, OpenAI, Claude, and Local Ollama) on-the-fly at runtime without restarting the application.

---

## 🚀 Key Features

* **Provider Abstraction**: Decoupled interface supporting OpenAI (GPT-4o), Google Gemini (1.5 Flash), Anthropic Claude (3.5 Sonnet), and Local models (Ollama).
* **Autonomous Function Loop**: The AI dynamically executes system and browser tools, loops their outputs back to the context window, and resolves tasks autonomously without prompting you for confirmation.
* **Browser Automation Sidecar**: A Python agent that opens your system's browser, scrapes page contents, and filters search results.
* **IMAP Email Reader Sidecar**: A secure Python script that queries your inbox for unread or flagged emails (includes a zero-setup simulated sandbox mode).
* **Sleek Cyberpunk UI**: High-end glassmorphism dashboard containing a real-time console streaming execution logs directly from Rust and Python.
* **Local Storage Persistence**: Saves all API keys, prompts, and server settings in the browser's storage so your configurations persist across reloads and recompilations.

---

## 🛠 Prerequisites

Before starting, make sure you have the following installed:

1. **Rust & Cargo**: [Install Rustup](https://rustup.rs/) (Tauri core backend).
2. **Node.js & pnpm**: [Install Node](https://nodejs.org/) and run `npm install -g pnpm`.
3. **Python 3**: Ensure `python3` and `pip3` are available.
4. **Ollama (Optional for offline use)**: [Download Ollama](https://ollama.com) (required to run fully local models).

---

## 📦 Installation & Setup

### Step 1: Install Frontend Dependencies
From the root directory, run:
```bash
pnpm install
```

### Step 2: Install Python Sidecar Requirements
Install the scraping requirements for the browser agent:
```bash
pip3 install -r sidecars/browser_agent/requirements.txt
```
*(No installs are needed for the email agent, as it utilizes Python's built-in `imaplib`)*

### Step 3: Configure Environment Keys (Optional)
You can configure your keys by creating a `.env` file in the root workspace directory:
```env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
CLAUDE_API_KEY=your_claude_api_key
LOCAL_API_URL=http://localhost:11434
```
*Note: You can also configure all keys and prompts directly within the running application by clicking **⚙ Settings** (saved to Local Storage).*

---

## 🤖 Running a Fully Local LLM (Ollama)

1. Launch the **Ollama** application on your machine.
2. In your terminal, pull your preferred model. We highly recommend `llama3-groq-tool-use` for optimal JSON argument generation:
   ```bash
   ollama run llama3-groq-tool-use
   ```
3. Open the **⚙ Settings** modal in Echo AI, select **Local / Ollama** as your active provider, verify the port `http://localhost:11434`, and click **Save Config**.

---

## 🖥 How to Run the Project

To compile the Rust backend and launch the desktop application in development mode:

```bash
pnpm tauri dev
```

To bundle the application for production release:
```bash
pnpm tauri build
```

---

## 📧 Secure Email Integration Setup
To read real emails (e.g., from Gmail) instead of running the simulated sandbox:
1. Enable **IMAP** in your email account settings.
2. Generate an **App Password** (in Gmail: Google Account > Security > 2-Step Verification > App Passwords).
3. Open **⚙ Settings** in Echo AI and enter:
   * **IMAP Mail Server**: `imap.gmail.com`
   * **Email Address**: `your_address@gmail.com`
   * **App Password**: `your-16-character-passcode`
4. Click **Save Config**. You can now ask the AI: *"do I have any unread emails?"* or *"summarize my important emails"*.
