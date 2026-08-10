import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import { Activity, Bot, ChevronRight, Globe, Sparkles, UserRound } from "lucide-react";
import { CommandInput } from "../features/home/CommandInput";
import { VoiceOverlay } from "../features/home/VoiceOverlay";
import { useChatStore } from "../store/chatStore";
import Logs from "../features/home/logs";

export function HomeScreen() {
  const [showVoice, setShowVoice] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const { config, messages, logs, loading } = useChatStore();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, logs, loading]);

  const getModelBadgeClass = (model: string) => {
    const m = model.toLowerCase();
    if (m.includes("gemini")) return "bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/35";
    if (m.includes("openai")) return "bg-accent-green/25 text-accent-green border border-accent-green/35";
    if (m.includes("claude")) return "bg-accent-purple/25 text-accent-purple border border-accent-purple/35";
    if (m.includes("glm")) return "bg-accent-blue/25 text-accent-blue border border-accent-blue/35";
    if (m.includes("local")) return "bg-accent-purple/25 text-accent-purple border border-accent-purple/35";
    return "bg-accent-blue/25 text-accent-blue border border-accent-blue/35";
  };

  const recentLogs = logs.slice(-10).reverse();

  return (
    <div className='flex flex-col h-screen bg-bg-primary text-text-main relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,240,255,0.03),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(199,125,255,0.03),transparent_40%)]'>
      <header className='flex justify-between items-center px-8 py-4 bg-bg-glass backdrop-blur-md border-b border-border-color z-10'>
        <div className='flex items-center gap-3'>
          <h1 className='text-lg font-extrabold tracking-widest bg-gradient-to-r from-text-main to-accent-cyan bg-clip-text text-transparent font-sans'>
            E C H O
          </h1>
        </div>

        <div className='flex items-center gap-4'>
          {config && (
            <div className='text-xs px-3 py-1.5 rounded bg-bg-secondary border border-border-color font-medium text-text-muted'>
              Engine:{" "}
              <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ml-1.5 uppercase ${getModelBadgeClass(config.active_model)}`}>
                {config.active_model}
              </span>
            </div>
          )}

          <button
            className={`px-4 py-1.5 rounded text-sm font-semibold border transition-all cursor-pointer ${
              showLogs
                ? "bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                : "bg-bg-secondary border-border-color text-text-main hover:bg-bg-tertiary hover:border-accent-cyan/50"
            }`}
            onClick={() => setShowLogs(!showLogs)}
          >
            📋 Logs
          </button>

          <button
            className='px-4 py-1.5 rounded bg-bg-secondary border border-border-color text-text-main text-sm font-semibold hover:bg-bg-tertiary hover:border-accent-cyan/50 hover:shadow-[0_0_10px_rgba(0,240,255,0.15)] transition-all cursor-pointer'
            onClick={() => navigate("/settings")}
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      <div className='flex flex-1 overflow-hidden relative'>
        <main className='flex flex-col flex-1 overflow-hidden'>
          <div ref={scrollRef} className='flex-1 overflow-y-auto px-5 py-5 md:px-8'>
            {messages.length === 0 ? (
              <div className='flex h-full items-center justify-center'>
                <div className='max-w-xl rounded-3xl border border-border-color bg-bg-secondary/40 p-8 text-center shadow-[0_0_30px_rgba(0,240,255,0.08)]'>
                  <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 text-accent-cyan shadow-[0_0_18px_rgba(0,240,255,0.2)]'>
                    <Bot className='h-7 w-7' />
                  </div>
                  <h2 className='text-xl font-semibold text-text-main'>What should Echo do next?</h2>
                  <p className='mt-2 text-sm leading-relaxed text-text-muted'>
                    Ask it to open a browser, navigate to a site, search the web, inspect files, or run local commands.
                  </p>
                </div>
              </div>
            ) : (
              <div className='mx-auto flex max-w-4xl flex-col gap-4'>
                {messages.map((message) => (
                  <div key={message.id} className={`flex animate-float-in ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-2xl rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(10,10,12,0.25)] ${
                        message.role === "user"
                          ? "border-accent-cyan/30 bg-gradient-to-br from-accent-cyan/20 to-accent-purple/10 text-text-main"
                          : "border-border-color bg-bg-secondary/60 text-text-main"
                      }`}
                    >
                      <div className='mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-text-muted'>
                        {message.role === "user" ? <UserRound className='h-3 w-3' /> : <Bot className='h-3 w-3' />}
                        {message.role === "user" ? "You" : (config?.active_model ?? "Echo")}
                      </div>

                      <div className='markdown-body text-sm leading-7 text-text-main/95'>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className='flex justify-start animate-float-in'>
                    <div className='max-w-md rounded-2xl border border-border-color bg-bg-secondary/60 px-4 py-3 shadow-[0_12px_30px_rgba(10,10,12,0.25)]'>
                      <div className='mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-text-muted'>
                        <Bot className='h-3 w-3 text-accent-cyan' />
                        Echo is thinking
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='h-2.5 w-2.5 rounded-full bg-accent-cyan animate-bounce [animation-delay:0ms]' />
                        <span className='h-2.5 w-2.5 rounded-full bg-accent-purple animate-bounce [animation-delay:120ms]' />
                        <span className='h-2.5 w-2.5 rounded-full bg-accent-blue animate-bounce [animation-delay:240ms]' />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className='p-4 border-t border-border-color bg-bg-secondary/40 backdrop-blur-md flex flex-col gap-3'>
            <CommandInput onVoiceClick={() => setShowVoice(true)} />
          </footer>
        </main>

        {showLogs && <Logs recentLogs={recentLogs} setShowLogs={setShowLogs} />}
      </div>

      {showVoice && <VoiceOverlay onClose={() => setShowVoice(false)} />}
    </div>
  );
}
