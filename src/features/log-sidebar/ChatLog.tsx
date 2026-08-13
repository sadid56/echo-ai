import { useEffect, useRef } from "react";
import { Button } from "../../components/ui/button";
import { useChatStore } from "../../store/chatStore";

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
          <div key={index} className='border border-border-color rounded-xl overflow-hidden bg-bg-tertiary/90 my-3 w-full max-w-full'>
            <div className='flex justify-between items-center px-4 py-2 bg-bg-secondary border-b border-border-color/50 text-xs font-mono text-text-muted'>
              <span className='font-bold text-[10px] uppercase tracking-wider text-accent-cyan'>{language}</span>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-auto border-0 bg-transparent px-0 py-0 text-[10px] font-mono tracking-wider text-text-muted hover:text-text-main'
                onClick={() => navigator.clipboard.writeText(codeText)}
              >
                Copy
              </Button>
            </div>
            <pre className='p-4 overflow-x-auto font-mono text-xs leading-relaxed bg-bg-primary/45'>
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={index} className='whitespace-pre-wrap'>
          {boldParts.map((bPart, bIndex) => {
            if (bPart.startsWith("**") && bPart.endsWith("**")) {
              return (
                <strong key={bIndex} className='font-bold text-text-main'>
                  {bPart.slice(2, -2)}
                </strong>
              );
            }
            return bPart;
          })}
        </p>
      );
    });
  };

  const getModelBadgeClass = (model: string) => {
    const m = model.toLowerCase();
    if (m.includes("local")) return "bg-accent-purple/15 text-accent-purple border border-accent-purple/20";
    if (m.includes("gemini")) return "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20";
    if (m.includes("openai")) return "bg-accent-green/15 text-accent-green border border-accent-green/20";
    return "bg-accent-blue/15 text-accent-blue border border-accent-blue/20";
  };

  return (
    <div className='h-full overflow-y-auto px-2 py-4 flex flex-col gap-6 scroll-smooth'>
      {messages.length === 0 ? (
        <div className='flex flex-col items-center justify-center text-center h-[65vh] max-w-lg mx-auto gap-4'>
          <h2 className='text-2xl font-bold tracking-tight bg-gradient-to-r from-text-main to-accent-cyan bg-clip-text text-transparent font-sans'>
            Welcome to Echo AI Workspace
          </h2>
          <p className='text-text-muted text-sm max-w-sm font-sans leading-relaxed'>
            Select an AI provider in the settings, then type a command to start orchestration.
          </p>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6'>
            <div
              className='p-4 rounded-xl bg-bg-secondary hover:bg-bg-tertiary border border-border-color hover:border-accent-cyan/40 transition-all cursor-pointer text-left text-xs font-semibold leading-relaxed font-sans'
              onClick={() => {
                const el = document.getElementById("cmd-input") as HTMLInputElement;
                if (el) {
                  el.value = "List directory contents of '.'";
                  el.dispatchEvent(new Event("input", { bubbles: true }));
                }
              }}
            >
              📁 List current workspace files
            </div>
            <div
              className='p-4 rounded-xl bg-bg-secondary hover:bg-bg-tertiary border border-border-color hover:border-accent-cyan/40 transition-all cursor-pointer text-left text-xs font-semibold leading-relaxed font-sans'
              onClick={() => {
                const el = document.getElementById("cmd-input") as HTMLInputElement;
                if (el) {
                  el.value = "Find jobs form Bangladesh, React developer within 2 days";
                  el.dispatchEvent(new Event("input", { bubbles: true }));
                }
              }}
            >
              🌐 Browse & scrape job listings
            </div>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 flex flex-col gap-2 relative shadow-lg ${
                msg.role === "user"
                  ? "bg-bg-tertiary border border-border-color rounded-tr-none text-text-main"
                  : "bg-bg-secondary border border-border-color rounded-tl-none text-text-main"
              }`}
            >
              {msg.role === "assistant" && (
                <div className='flex items-center gap-2 mb-1 shrink-0'>
                  <span className='text-xs font-bold text-accent-cyan uppercase tracking-wider'>Echo AI</span>
                  {msg.model && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${getModelBadgeClass(msg.model)}`}
                    >
                      {msg.model}
                    </span>
                  )}
                </div>
              )}
              <div className='text-sm leading-relaxed font-sans flex flex-col gap-3 text-text-main/90'>{renderContent(msg.content)}</div>
              <div className='text-[10px] text-text-muted/50 text-right mt-1.5 font-mono'>{msg.timestamp}</div>
            </div>
          </div>
        ))
      )}
      {loading && (
        <div className='flex w-full justify-start animate-fade-in'>
          <div className='max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 flex flex-col gap-2 relative shadow-lg bg-bg-secondary border border-border-color rounded-tl-none text-text-main'>
            <div className='flex items-center gap-2 mb-1 shrink-0'>
              <span className='text-xs font-bold text-accent-cyan uppercase tracking-wider animate-pulse'>Echo is thinking...</span>
            </div>
            <div className='flex items-center gap-1.5 py-2 px-1'>
              <span className='w-2.5 h-2.5 rounded-full bg-accent-cyan animate-bounce duration-300'></span>
              <span
                className='w-2.5 h-2.5 rounded-full bg-accent-purple animate-bounce duration-500'
                style={{ animationDelay: "0.15s" }}
              ></span>
              <span
                className='w-2.5 h-2.5 rounded-full bg-accent-blue animate-bounce duration-700'
                style={{ animationDelay: "0.3s" }}
              ></span>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
