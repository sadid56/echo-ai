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
  const [sysPrompt, setSysPrompt] = useState("");
  const [aiName, setAiName] = useState("");
  const [userName, setUserName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setModel(config.active_model);
      setGeminiKey(config.api_keys.gemini);
      setOpenaiKey(config.api_keys.openai);
      setClaudeKey(config.api_keys.claude);
      setLocalUrl(config.api_keys.local_url);
      setSysPrompt(config.system_prompt);
      setAiName(config.ai_name);
      setUserName(config.user_name);
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
      },
      system_prompt: sysPrompt,
      ai_name: aiName,
      user_name: userName,
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
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Application Settings</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="settings-section">
            <h4>AI Model Selection</h4>
            <div className="input-field">
              <label>Active Provider</label>
              <select
                value={model}
                onChange={(e) => setModel(e.currentTarget.value)}
              >
                <option value="Local">Local / Ollama (Offline Simulation fallback)</option>
                <option value="Gemini">Gemini 1.5 Flash (Google)</option>
                <option value="OpenAI">GPT-4o (OpenAI)</option>
                <option value="Claude">Claude 3.5 Sonnet (Anthropic)</option>
              </select>
            </div>
          </div>
          
          <div className="settings-section">
            <h4>API Keys & Endpoint Configuration</h4>
            {model === "Gemini" && (
              <div className="input-field">
                <label>Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.currentTarget.value)}
                  placeholder="AIzaSy..."
                />
              </div>
            )}
            {model === "OpenAI" && (
              <div className="input-field">
                <label>OpenAI API Key</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.currentTarget.value)}
                  placeholder="sk-proj-..."
                />
              </div>
            )}
            {model === "Claude" && (
              <div className="input-field">
                <label>Claude API Key</label>
                <input
                  type="password"
                  value={claudeKey}
                  onChange={(e) => setClaudeKey(e.currentTarget.value)}
                  placeholder="sk-ant-..."
                />
              </div>
            )}
            {model === "Local" && (
              <div className="input-field">
                <label>Ollama Server URL</label>
                <input
                  type="text"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.currentTarget.value)}
                  placeholder="http://localhost:11434"
                />
              </div>
            )}
          </div>

          <div className="settings-section">
            <h4>Personalization</h4>
            <div className="input-grid">
              <div className="input-field">
                <label>User Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.currentTarget.value)}
                />
              </div>
              <div className="input-field">
                <label>Assistant Name</label>
                <input
                  type="text"
                  value={aiName}
                  onChange={(e) => setAiName(e.currentTarget.value)}
                />
              </div>
            </div>
            <div className="input-field">
              <label>Global System Prompt</label>
              <textarea
                value={sysPrompt}
                onChange={(e) => setSysPrompt(e.currentTarget.value)}
                rows={4}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="primary-button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Config"}
          </button>
        </div>
      </div>
    </div>
  );
};
