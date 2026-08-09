import { useState } from "react";
import { ChatProvider, useChatStore } from "./store/chatStore";
import { ChatLog } from "./components/ChatLog";
import { CommandInput } from "./components/CommandInput";
import { TerminalOutput } from "./components/TerminalOutput";
import { SettingsModal } from "./components/SettingsModal";
import "./App.css";

function Workspace() {
  const [showSettings, setShowSettings] = useState(false);
  const { config } = useChatStore();

  return (
    <div className="workspace-layout">
      <header className="workspace-header">
        <div className="header-logo">
          <span className="logo-pulse animate-pulse"></span>
          <h1>E C H O // A I</h1>
        </div>
        <div className="header-status">
          {config && (
            <div className="active-model-badge">
              Engine:{" "}
              <span className={`badge ${config.active_model.toLowerCase()}`}>
                {config.active_model}
              </span>
            </div>
          )}
          <button
            className="settings-trigger-btn"
            onClick={() => setShowSettings(true)}
          >
            ⚙ Settings
          </button>
        </div>
      </header>
      <main className="workspace-chat-area">
        <ChatLog />
      </main>
      <footer className="workspace-controls">
        <CommandInput />
        <TerminalOutput />
      </footer>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function App() {
  return (
    <ChatProvider>
      <Workspace />
    </ChatProvider>
  );
}

export default App;
