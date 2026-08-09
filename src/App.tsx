import { useState } from "react";
import { ChatProvider, useChatStore } from "./store/chatStore";
import { ChatLog } from "./components/ChatLog";
import { CommandInput } from "./components/CommandInput";
import { TerminalOutput } from "./components/TerminalOutput";
import { SettingsModal } from "./components/SettingsModal";
import { VoiceOverlay } from "./components/VoiceOverlay";
import "./App.css";

function Workspace() {
  const [showSettings, setShowSettings] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const { config } = useChatStore();

  const getModelBadgeClass = (model: string) => {
    const m = model.toLowerCase();
    if (m.includes("local")) return "bg-accent-purple/25 text-accent-purple border border-accent-purple/35";
    if (m.includes("gemini")) return "bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/35";
    if (m.includes("openai")) return "bg-accent-green/25 text-accent-green border border-accent-green/35";
    return "bg-accent-blue/25 text-accent-blue border border-accent-blue/35";
  };

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-main relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,240,255,0.03),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(199,125,255,0.03),transparent_40%)]">
      <header className="flex justify-between items-center px-8 py-4 bg-bg-glass backdrop-blur-md border-b border-border-color z-10">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-accent-cyan rounded-full shadow-[0_0_10px_#00f0ff] animate-pulse"></span>
          <h1 className="text-lg font-extrabold tracking-widest bg-gradient-to-r from-text-main to-accent-cyan bg-clip-text text-transparent font-sans">
            E C H O // A I
          </h1>
        </div>
        <div className="flex items-center gap-6">
          {config && (
            <div className="text-xs px-3 py-1.5 rounded bg-bg-secondary border border-border-color font-medium text-text-muted">
              Engine:{" "}
              <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ml-1.5 uppercase ${getModelBadgeClass(config.active_model)}`}>
                {config.active_model}
              </span>
            </div>
          )}
          <button
            className="px-4 py-1.5 rounded bg-bg-secondary border border-border-color text-text-main text-sm font-semibold hover:bg-bg-tertiary hover:border-accent-cyan/50 hover:shadow-[0_0_10px_rgba(0,240,255,0.15)] transition-all cursor-pointer"
            onClick={() => setShowSettings(true)}
          >
            ⚙ Settings
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <ChatLog />
      </main>
      <footer className="p-4 border-t border-border-color bg-bg-secondary/40 backdrop-blur-md flex flex-col gap-3">
        <CommandInput onVoiceClick={() => setShowVoice(true)} />
        <TerminalOutput />
      </footer>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showVoice && <VoiceOverlay onClose={() => setShowVoice(false)} />}
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
