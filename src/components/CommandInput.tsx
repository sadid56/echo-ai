import { useState, FormEvent, KeyboardEvent } from "react";
import { useChatStore } from "../store/chatStore";

interface CommandInputProps {
  onVoiceClick: () => void;
}

export const CommandInput: React.FC<CommandInputProps> = ({ onVoiceClick }) => {
  const [input, setInput] = useState("");
  const { sendMessage, loading, clearChat } = useChatStore();

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="command-input-form">
      <div className="input-wrapper">
        <textarea
          id="cmd-input"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a prompt or task (e.g. 'List current files' or 'Find Senior Frontend roles')..."
          disabled={loading}
          rows={1}
        />
        <div className="button-group">
          <button
            type="button"
            onClick={clearChat}
            className="secondary-button"
            title="Clear chat context"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onVoiceClick}
            className="secondary-button voice-trigger-btn"
            title="Start Live Voice Talking Mode"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", padding: 0 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="primary-button"
          >
            {loading ? "Running..." : "Send"}
          </button>
        </div>
      </div>
    </form>
  );
};
