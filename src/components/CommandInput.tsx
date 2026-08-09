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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 focus-within:border-accent-cyan/60 focus-within:shadow-[0_0_15px_rgba(0,240,255,0.08)] transition-all gap-4">
        <textarea
          id="cmd-input"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a prompt or task (e.g. 'List current files' or 'Find Senior Frontend roles')..."
          disabled={loading}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none text-text-main placeholder-text-muted resize-none text-sm leading-relaxed pr-2 font-sans py-1"
        />
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={clearChat}
            className="px-4 py-2.5 rounded-lg bg-bg-secondary hover:bg-bg-primary border border-border-color hover:border-text-muted text-text-main text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
            title="Clear chat context"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onVoiceClick}
            className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-primary border border-border-color hover:border-accent-cyan text-text-main hover:text-accent-cyan flex items-center justify-center w-9 h-9 transition-all cursor-pointer"
            title="Start Live Voice Talking Mode"
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
            className="px-5 py-2.5 rounded-lg bg-accent-cyan hover:bg-accent-cyan/95 text-bg-primary text-xs font-extrabold tracking-wider uppercase hover:shadow-[0_0_12px_rgba(0,240,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all cursor-pointer"
          >
            {loading ? "Running..." : "Send"}
          </button>
        </div>
      </div>
    </form>
  );
};
