import { useState, useEffect, FC } from "react";
import { useChatStore, AppConfig } from "../store/chatStore";

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: FC<SettingsModalProps> = ({ onClose }) => {
  const { config, updateConfig } = useChatStore();
  const [model, setModel] = useState("Local");
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [localUrl, setLocalUrl] = useState("");
  const [localModel, setLocalModel] = useState("qwen2.5-coder:3b");
  const [sysPrompt, setSysPrompt] = useState("");
  const [aiName, setAiName] = useState("");
  const [userName, setUserName] = useState("");
  const [imapServer, setImapServer] = useState("imap.gmail.com");
  const [emailAddress, setEmailAddress] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (config) {
      setModel(config.active_model);
      setGeminiKey(config.api_keys.gemini);
      setOpenaiKey(config.api_keys.openai);
      setClaudeKey(config.api_keys.claude);
      setLocalUrl(config.api_keys.local_url);
      setLocalModel(config.api_keys.local_model || "llama3-groq-tool-use");
      setSysPrompt(config.system_prompt);
      setAiName(config.ai_name);
      setUserName(config.user_name);
      if (config.email) {
        setImapServer(config.email.imap_server);
        setEmailAddress(config.email.email_address);
        setAppPassword(config.email.app_password);
      }
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    const newConfig: AppConfig = {
      active_model: model,
      api_keys: {
        gemini: geminiKey,
        openai: openaiKey,
        claude: claudeKey,
        local_url: localUrl,
        local_model: localModel,
      },
      system_prompt: sysPrompt,
      ai_name: aiName,
      user_name: userName,
      email: {
        imap_server: imapServer,
        email_address: emailAddress,
        app_password: appPassword,
      },
    };

    try {
      await updateConfig(newConfig);
      onClose();
    } catch (err) {
      alert(`Save failed: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-md flex items-center justify-center z-[200] animate-fade-in">
      <div className="w-[90%] max-w-xl max-h-[85vh] rounded-2xl border border-border-color bg-bg-secondary flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        <div className="flex justify-between items-center px-6 py-4 border-b border-border-color/50">
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-text-main font-sans">Application Settings</h3>
          <button className="text-2xl text-text-muted hover:text-text-main transition-colors cursor-pointer select-none bg-transparent border-none outline-none leading-none pb-1" onClick={onClose}>×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3.5">
            <h4 className="text-[10.5px] font-bold tracking-wider uppercase text-accent-cyan border-l-2 border-accent-cyan pl-2 font-sans">AI Model Selection</h4>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">Active Provider</label>
              <select
                value={model}
                onChange={(e: React.ChangeEvent<any>) => setModel(e.currentTarget.value)}
                className="bg-bg-tertiary border border-border-color focus:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-all cursor-pointer"
              >
                <option value="Local">Local / Ollama (Offline Simulation fallback)</option>
                <option value="Gemini">Gemini 1.5 Flash (Google)</option>
                <option value="OpenAI">GPT-4o (OpenAI)</option>
                <option value="Claude">Claude 3.5 Sonnet (Anthropic)</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col gap-3.5">
            <h4 className="text-[10.5px] font-bold tracking-wider uppercase text-accent-cyan border-l-2 border-accent-cyan pl-2 font-sans">API Keys & Endpoint Configuration</h4>
            {model === "Gemini" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e: React.ChangeEvent<any>) => setGeminiKey(e.currentTarget.value)}
                  placeholder="AIzaSy..."
                  className="bg-bg-tertiary border border-border-color focus:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-all"
                />
              </div>
            )}
            {model === "OpenAI" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">OpenAI API Key</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e: React.ChangeEvent<any>) => setOpenaiKey(e.currentTarget.value)}
                  placeholder="sk-proj-..."
                  className="bg-bg-tertiary border border-border-color focus:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-all"
                />
              </div>
            )}
            {model === "Claude" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">Claude API Key</label>
                <input
                  type="password"
                  value={claudeKey}
                  onChange={(e: React.ChangeEvent<any>) => setClaudeKey(e.currentTarget.value)}
                  placeholder="sk-proj-..."
                  className="bg-bg-tertiary border border-border-color focus:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-all"
                />
              </div>
            )}
            {model === "Local" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">Ollama Server URL</label>
                  <input
                    type="text"
                    value={localUrl}
                    onChange={(e: React.ChangeEvent<any>) => setLocalUrl(e.currentTarget.value)}
                    placeholder="http://localhost:11434"
                    className="bg-bg-tertiary border border-border-color focus:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">Ollama Model Name</label>
                  
                  {/* Trigger Button */}
                  <div 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="bg-bg-tertiary border border-border-color focus-within:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg flex justify-between items-center cursor-pointer select-none transition-all hover:bg-bg-tertiary/75"
                  >
                    <span className="font-semibold text-accent-cyan">{localModel}</span>
                    <svg 
                      className={`w-4 h-4 text-text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute top-[100%] left-0 right-0 mt-1.5 bg-bg-secondary border border-border-color rounded-xl shadow-2xl z-[300] overflow-hidden flex flex-col max-h-64 overflow-y-auto divide-y divide-border-color/30 animate-fade-in backdrop-blur-md">
                      {/* Option: qwen2.5-coder:1.5b */}
                      <div 
                        onClick={() => {
                          setLocalModel("qwen2.5-coder:1.5b");
                          setDropdownOpen(false);
                        }}
                        className={`px-4 py-2.5 flex flex-col gap-0.5 cursor-pointer hover:bg-accent-cyan/5 transition-colors ${localModel === "qwen2.5-coder:1.5b" ? "bg-accent-cyan/10" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-main">qwen2.5-coder:1.5b</span>
                          <span className="text-[8px] font-extrabold uppercase tracking-wider bg-accent-cyan/20 text-accent-cyan px-1.5 py-0.5 rounded">Recommended</span>
                        </div>
                        <span className="text-[10px] text-text-muted">Super fast, low VRAM usage. Perfect for coding & automation.</span>
                      </div>

                      {/* Option: qwen2.5-coder:3b */}
                      <div 
                        onClick={() => {
                          setLocalModel("qwen2.5-coder:3b");
                          setDropdownOpen(false);
                        }}
                        className={`px-4 py-2.5 flex flex-col gap-0.5 cursor-pointer hover:bg-accent-cyan/5 transition-colors ${localModel === "qwen2.5-coder:3b" ? "bg-accent-cyan/10" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-main">qwen2.5-coder:3b</span>
                          <span className="text-[8px] font-extrabold uppercase tracking-wider bg-bg-tertiary text-text-muted px-1.5 py-0.5 rounded">Balanced</span>
                        </div>
                        <span className="text-[10px] text-text-muted">Excellent instruction following & code completion.</span>
                      </div>

                      {/* Option: llama3-groq-tool-use */}
                      <div 
                        onClick={() => {
                          setLocalModel("llama3-groq-tool-use");
                          setDropdownOpen(false);
                        }}
                        className={`px-4 py-2.5 flex flex-col gap-0.5 cursor-pointer hover:bg-accent-cyan/5 transition-colors ${localModel === "llama3-groq-tool-use" ? "bg-accent-cyan/10" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-main">llama3-groq-tool-use</span>
                        </div>
                        <span className="text-[10px] text-text-muted">Native tool calling with Llama-3 architecture.</span>
                      </div>

                      {/* Custom Input Option */}
                      <div className="px-4 py-2.5 flex flex-col gap-1.5 bg-bg-tertiary/40">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted">Or enter a custom model</span>
                        <input
                          type="text"
                          value={localModel}
                          onChange={(e: React.ChangeEvent<any>) => setLocalModel(e.currentTarget.value)}
                          placeholder="Type custom model name..."
                          className="bg-bg-tertiary border border-border-color/80 focus:border-accent-cyan/60 text-text-main text-xs font-sans px-2.5 py-1.5 rounded-md outline-none transition-all w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3.5">
            <h4 className="text-[10.5px] font-bold tracking-wider uppercase text-accent-cyan border-l-2 border-accent-cyan pl-2 font-sans">Email Configuration</h4>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">IMAP Mail Server</label>
              <input
                type="text"
                value={imapServer}
                onChange={(e: React.ChangeEvent<any>) => setImapServer(e.currentTarget.value)}
                placeholder="imap.gmail.com"
                className="bg-bg-tertiary border border-border-color focus:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">Email Address</label>
                <input
                  type="text"
                  value={emailAddress}
                  onChange={(e: React.ChangeEvent<any>) => setEmailAddress(e.currentTarget.value)}
                  placeholder="example@gmail.com"
                  className="bg-bg-tertiary border border-border-color focus:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">App Password</label>
                <input
                  type="password"
                  value={appPassword}
                  onChange={(e: React.ChangeEvent<any>) => setAppPassword(e.currentTarget.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="bg-bg-tertiary border border-border-color focus:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <h4 className="text-[10.5px] font-bold tracking-wider uppercase text-accent-cyan border-l-2 border-accent-cyan pl-2 font-sans">Personalization</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">User Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e: React.ChangeEvent<any>) => setUserName(e.currentTarget.value)}
                  className="bg-bg-tertiary border border-border-color focus:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">Assistant Name</label>
                <input
                  type="text"
                  value={aiName}
                  onChange={(e: React.ChangeEvent<any>) => setAiName(e.currentTarget.value)}
                  className="bg-bg-tertiary border border-border-color focus:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-sans">Global System Prompt</label>
              <textarea
                value={sysPrompt}
                onChange={(e: React.ChangeEvent<any>) => setSysPrompt(e.currentTarget.value)}
                rows={4}
                className="bg-bg-tertiary border border-border-color focus:border-accent-cyan/60 text-text-main text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border-color/50 flex justify-end gap-3 bg-bg-tertiary/20 shrink-0">
          <button className="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-primary border border-border-color text-text-main text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="px-5 py-2.5 rounded-lg bg-accent-cyan hover:bg-accent-cyan/95 text-bg-primary text-xs font-extrabold uppercase tracking-wider hover:shadow-[0_0_10px_rgba(0,240,255,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Config"}
          </button>
        </div>
      </div>
    </div>
  );
};
