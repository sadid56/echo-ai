import { useState, FormEvent, KeyboardEvent } from "react";
import { useChatStore } from "../store/chatStore";

export const CommandInput = () => {
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
