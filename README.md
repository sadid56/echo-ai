# Echo AI - Enterprise Assistant Workspace

Echo AI is an autonomous AI desktop workspace built using **Tauri (Rust Core)**, **React (TypeScript Frontend)**, and **Python Automation Sidecars**.

It supports multiple remote AI providers and lets you switch them at runtime from the app settings, while keeping all configuration in the app instead of environment files.

---

## 🚀 Key Features

* **Provider Abstraction**: Decoupled interface supporting OpenAI (GPT-4o), Google Gemini (1.5 Flash), Anthropic Claude (3.5 Sonnet), and GLM.
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
4. **API keys**: Add your chosen provider keys directly from the app settings panel.

---

## 📦 Installation & Setup

### Step 1: Install Frontend Dependencies
From the root directory, run:
```bash
pnpm install
```

### Step 2: Install Python Sidecar Requirements
Install the shared Python dependencies used by the sidecars:
```bash
pip3 install -r sidecars/requirements.txt
```
*(No extra installs are needed for the email agent beyond Python's built-in `imaplib`)*

### Step 3: Add API Keys in the App
Open the **⚙ Settings** modal in Echo AI and enter the API key for your selected provider. These values are saved in the app's local configuration and do not require any `.env` file.

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
