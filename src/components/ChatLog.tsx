import { useEffect, useRef } from "react";
import { useChatStore } from "../store/chatStore";

export const ChatLog = () => {
  const { messages, loading } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        let language = "code";
        let codeLines = lines;
        if (lines.length > 0 && /^[a-zA-Z0-9_-]+$/.test(lines[0])) {
          language = lines[0];
          codeLines = lines.slice(1);
        }
        const codeText = codeLines.join("\n");
        return (
          <div key={index} className="code-block-container">
            <div className="code-block-header">
              <span className="code-language">{language}</span>
              <button
                className="copy-button"
                onClick={() => navigator.clipboard.writeText(codeText)}
              >
                Copy
              </button>
            </div>
            <pre className="code-pre">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={index} className="message-paragraph">
          {boldParts.map((bPart, bIndex) => {
            if (bPart.startsWith("**") && bPart.endsWith("**")) {
              return <strong key={bIndex}>{bPart.slice(2, -2)}</strong>;
            }
            return bPart;
          })}
        </p>
      );
    });
  };

  return (
    <div className="chat-log-container">
      {messages.length === 0 ? (
        <div className="chat-welcome">
          <h2>Welcome to Echo AI Workspace</h2>
          <p>Select an AI provider in the settings, then type a command to start orchestration.</p>
          <div className="suggestions">
            <div
              className="suggestion-card"
              onClick={() => {
                const el = document.getElementById("cmd-input") as HTMLInputElement;
                if (el) el.value = "List directory contents of '.'";
              }}
            >
              📁 List current workspace files
            </div>
            <div
              className="suggestion-card"
              onClick={() => {
                const el = document.getElementById("cmd-input") as HTMLInputElement;
                if (el) el.value = "Find Senior Frontend roles on https://news.ycombinator.com";
              }}
            >
              🌐 Browse & scrape hacker news
            </div>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={`chat-message-wrapper ${msg.role}`}>
            <div className="chat-message-bubble">
              {msg.role === "assistant" && (
                <div className="assistant-header">
                  <span className="assistant-name">Echo AI</span>
                  {msg.model && (
                    <span className={`model-badge ${msg.model.toLowerCase()}`}>
                      {msg.model}
                    </span>
                  )}
                </div>
              )}
              <div className="message-body">{renderContent(msg.content)}</div>
              <div className="message-meta">{msg.timestamp}</div>
            </div>
          </div>
        ))
      )}
      {loading && (
        <div className="chat-message-wrapper assistant loading">
          <div className="chat-message-bubble">
            <div className="assistant-header">
              <span className="assistant-name animate-pulse">Echo is thinking...</span>
            </div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
