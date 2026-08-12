import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, UserRound } from "lucide-react";
import { CommandInput } from "../features/home/CommandInput";
import { VoiceOverlay } from "../features/home/VoiceOverlay";
import { useChatStore } from "../store/chatStore";
import Logs from "../features/home/logs";
import Header from "../layouts/header";

export function HomeScreen() {
  const [showVoice, setShowVoice] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const { config, messages, logs, loading } = useChatStore();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, logs, loading]);



  const recentLogs = logs.slice(-10).reverse();

  return (
    <div className='flex flex-col h-screen bg-bg-primary text-text-main relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,240,255,0.03),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(199,125,255,0.03),transparent_40%)]'>
      <Header showLogs={showLogs} setShowLogs={setShowLogs} />

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
                      className={`max-w-2xl w-full rounded-2xl border border-border-color bg-bg-secondary/60 px-5 py-4 text-text-main shadow-[0_12px_30px_rgba(10,10,12,0.25)] transition-all duration-300 hover:border-accent-cyan/20`}
                    >
                      <div className='mb-2.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-text-muted border-b border-border-color pb-2'>
                        {message.role === "user" ? (
                          <>
                            <UserRound className='h-3.5 w-3.5 text-accent-purple' />
                            <span className="font-semibold text-accent-purple">You</span>
                          </>
                        ) : (
                          <>
                            <Bot className='h-3.5 w-3.5 text-accent-cyan' />
                            <span className="font-semibold text-accent-cyan">{config?.active_model ?? "Echo"}</span>
                          </>
                        )}
                        <span className="ml-auto text-[9px] text-text-muted/60 lowercase">{message.timestamp}</span>
                      </div>

                      <div className='markdown-body text-sm leading-7 text-text-main/95'>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (() => {
                  const getLoaderStatus = (logsList: string[]) => {
                    if (logsList.length === 0) return "Thinking...";
                    const recent = logsList.slice(-6).reverse();
                    for (const rawLog of recent) {
                      const log = rawLog.toLowerCase();
                      if (log.includes("run_browser_agent")) {
                        if (log.includes("click") || log.includes("button") || log.includes("link")) {
                          return "Clicking page element...";
                        }
                        if (log.includes("type") || log.includes("input") || log.includes("search") || log.includes("query") || log.includes("job")) {
                          return "Searching the web for jobs...";
                        }
                        return "Navigating browser & interacting with page...";
                      }
                      if (log.includes("execute_command")) {
                        return "Executing terminal command...";
                      }
                      if (log.includes("fetch_emails")) {
                        return "Connecting to server & retrieving emails...";
                      }
                      if (log.includes("read_file")) {
                        return "Reading file contents...";
                      }
                      if (log.includes("write_file")) {
                        return "Writing code modifications to file...";
                      }
                      if (log.includes("list_directory")) {
                        return "Scanning directory structure...";
                      }
                      if (log.includes("run_git_action")) {
                        return "Performing Git version control action...";
                      }
                      if (log.includes("tool success")) {
                        return "Processing results...";
                      }
                      if (log.includes("tool error")) {
                        return "Recovering from error...";
                      }
                      if (log.includes("requesting completion") || log.includes("starting pipeline")) {
                        return "Analyzing prompt & planning next steps...";
                      }
                    }
                    return "Processing request...";
                  };

                  const currentStatus = getLoaderStatus(logs);
                  const lastRawLog = logs.length > 0 ? logs[logs.length - 1].replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, "") : "";

                  return (
                    <div className='flex justify-start animate-float-in w-full max-w-2xl'>
                      <div className='w-full rounded-2xl border border-accent-cyan/30 bg-bg-secondary/80 p-5 shadow-[0_0_30px_rgba(0,240,255,0.15)] relative overflow-hidden'>
                        {/* Shimmer/Pulse ambient background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/5 via-accent-purple/5 to-accent-blue/5 animate-pulse" />
                        
                        <div className='relative z-10'>
                          <div className='mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-text-muted border-b border-border-color pb-2'>
                            <Bot className='h-3.5 w-3.5 text-accent-cyan animate-pulse' />
                            <span className="font-semibold text-accent-cyan animate-pulse">Echo is active</span>
                          </div>

                          <div className="flex items-start gap-4 py-2">
                            {/* Minimal Static Human Brain Icon without animation */}
                            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center bg-bg-primary/40 rounded-full border border-border-color/60 shadow-inner">
                              <svg className="absolute h-full w-full p-2.5" viewBox="0 0 100 100" fill="none">
                                {/* Left Brain Hemisphere Contour */}
                                <path d="M48,25 C32,23 20,35 24,52 C18,62 25,75 38,75 C43,75 46,70 48,66" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                                <path d="M46,38 C35,38 30,48 35,56 C30,62 38,68 45,62" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
                                
                                {/* Right Brain Hemisphere Contour */}
                                <path d="M52,25 C68,23 80,35 76,52 C82,62 75,75 62,75 C57,75 54,70 52,66" stroke="#c77dff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                                <path d="M54,38 C65,38 70,48 65,56 C70,62 62,68 55,62" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

                                {/* Central Axis */}
                                <path d="M50,28 L50,68" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
                              </svg>
                            </div>

                            <div className="flex flex-col gap-2 min-w-0 flex-1">
                              <p className="text-sm font-medium text-text-main tracking-wide">
                                {currentStatus}
                              </p>
                              {lastRawLog && (
                                <p className="text-[11px] text-text-muted truncate font-mono bg-bg-primary/50 px-2 py-1 rounded border border-border-color/50 max-w-md">
                                  {lastRawLog}
                                </p>
                              )}
                              
                              {/* Skeleton Content Loading blocks */}
                              <div className="flex flex-col gap-2 w-full mt-1.5">
                                <div className="h-2 w-11/12 rounded bg-text-muted/10 animate-pulse" />
                                <div className="h-2 w-5/6 rounded bg-text-muted/10 animate-pulse [animation-delay:150ms]" />
                                <div className="h-2 w-2/3 rounded bg-text-muted/10 animate-pulse [animation-delay:300ms]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
