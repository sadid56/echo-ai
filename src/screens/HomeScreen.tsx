import { useEffect, useRef, useState } from "react";
import { Bot, Sparkles, File } from "lucide-react";
import { CommandInput } from "../features/home/CommandInput";
import { VoiceOverlay } from "../features/home/VoiceOverlay";
import { useChatStore } from "../store/chatStore";
import Logs from "../features/home/logs";
import { Drawer } from "../components/ui/drawer";
import { getFriendlyMessage, getToolMessage } from "../lib/loaderMessages";
import { CustomMarkdown } from "../components/common/custom-markdown";
import { FlipWords } from "../components/ui/flipWords";

export function HomeScreen() {
  const [showVoice, setShowVoice] = useState(false);
  const { config, messages, logs, loading, showLogs, setShowLogs } = useChatStore();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const words = ["AI assistant", "code wizard", "dev companion", "smart copilot", "agentic helper"];

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: "smooth" });
    }
  }, [messages, logs, loading]);

  const recentLogs = logs.slice(-10).reverse();

  return (
    <>
      <main className='flex flex-col flex-1 overflow-hidden relative'>
        <div ref={scrollRef} className='flex-1 overflow-y-auto px-4 py-8 md:px-12 pb-[240px] scroll-smooth'>
            {messages.length === 0 ? (
              /* PREVIOUS SWEET SPOT AI CORE */
              <div className='flex h-full flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-1000'>
                <div className='relative flex h-40 w-40 items-center justify-center group'>
                  <div className='absolute inset-0 rounded-full bg-accent-cyan/15 blur-[40px]'></div>
                  <div className='absolute inset-0 rounded-full border border-white/5 border-t-accent-cyan/80 animate-[spin_10s_linear_infinite]'></div>
                  <div className='absolute inset-4 rounded-full border border-white/5 border-b-accent-purple/60 animate-[spin_15s_linear_infinite_reverse]'></div>
                  <div className='absolute inset-8 rounded-full border border-dashed border-white/20 animate-[spin_20s_linear_infinite]'></div>
                  <div className='relative h-18 w-18 rounded-full bg-gradient-to-br from-accent-cyan/50 to-accent-purple/50 p-[1px] shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-transform duration-500 group-hover:scale-110'>
                    <div className='h-full w-full rounded-full bg-[#0a0a0c] flex items-center justify-center overflow-hidden relative'>
                      <img src="/echo_logo.png" alt="Echo AI" className="h-full w-full object-cover z-10 rounded-full" />
                    </div>
                  </div>
                </div>

                 <div className='text-center space-y-4 z-10'>
                  <h1 className='text-2xl font-light tracking-tight text-white/90 drop-shadow-md min-h-[36px]'>
                    Echo is your personal{" "}
                    <FlipWords duration={3000} words={words} className='text-accent-cyan font-medium w-[130px] inline-block text-left whitespace-nowrap' />
                  </h1>
                </div>
              </div>
            ) : (
              /* CONVERSATION FEED */
              <div className='mx-auto flex max-w-4xl flex-col gap-8 pb-10'>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex w-full animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "user" ? (
                      <div className='group relative max-w-[85%] md:max-w-[75%]'>
                        <div className='absolute inset-0 bg-gradient-to-br from-accent-purple/10 to-accent-cyan/5 rounded-2xl rounded-tr-sm blur-md opacity-50'></div>

                        <div className='text-[15px] leading-relaxed font-light relative z-10 p-4 bg-white/[0.02] border border-white/5 rounded-2xl rounded-tr-sm'>
                          <CustomMarkdown content={message.content} />

                          {/* Message Attachments rendering */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className='flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-white/5'>
                              {message.attachments.map((att, idx) => (
                                <div 
                                  key={idx} 
                                  className='flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/10 rounded-xl text-[11px] text-text-muted'
                                >
                                  {att.mime_type.startsWith("image/") ? (
                                    <img 
                                      src={`data:${att.mime_type};base64,${att.data}`} 
                                      alt={att.name} 
                                      className='w-5 h-5 rounded object-cover' 
                                    />
                                  ) : (
                                    <File className='w-3.5 h-3.5 text-accent-cyan' />
                                  )}
                                  <span className='max-w-[100px] truncate'>{att.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className='flex gap-5 max-w-[95%] md:max-w-[90%] w-full'>
                        <div className='flex-shrink-0 mt-1 relative h-9 w-9 flex items-center justify-center rounded-full bg-[#121214] border border-white/10 shadow-[0_0_15px_rgba(0,240,255,0.1)]'>
                          <div className='absolute inset-[-2px] rounded-full border-t-[1.5px] border-accent-cyan/60 animate-[spin_4s_linear_infinite]'></div>
                          <Bot className='h-4 w-4 text-accent-cyan' />
                        </div>
                        <div className='flex-1 pt-1 space-y-1.5'>
                          <div className='flex items-center gap-3'>
                            <span className='text-[13px] font-semibold text-accent-cyan/90 tracking-wide'>
                              {message.model ?? config?.text_model?.model_name ?? "Echo"}
                            </span>
                            <span className='text-[10px] text-white/30 tracking-wider font-mono'>{message.timestamp}</span>
                          </div>

                          <CustomMarkdown content={message.content} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* ADVANCED AI PROCESSING / THINKING STATE */}
                {loading &&
                  (() => {
                    const getLoaderStatus = (logsList: string[]) => {
                      if (logsList.length === 0) return getFriendlyMessage("thinking", "initial");
                      for (let i = logsList.length - 1; i >= 0; i--) {
                        const rawLog = logsList[i];
                        const log = rawLog.toLowerCase();
                        if (log.includes("browser") || log.includes("run_browser_agent")) {
                          if (log.includes("click") || log.includes("clicking")) return getFriendlyMessage("clicking", rawLog);
                          if (log.includes("type") || log.includes("typing") || log.includes("input") || log.includes("search"))
                            return getFriendlyMessage("typing", rawLog);
                          if (log.includes("scroll") || log.includes("scrolling")) return getFriendlyMessage("scrolling", rawLog);
                          if (log.includes("navigate") || log.includes("navigating") || log.includes("open") || log.includes("url"))
                            return getFriendlyMessage("navigating", rawLog);
                          if (log.includes("screenshot") || log.includes("capture")) return getFriendlyMessage("screenshot", rawLog);
                        }
                        if (rawLog.includes("Executing tool")) {
                          const toolMatch = rawLog.match(/Executing tool '([^']+)' with arguments: (.*)/);
                          if (toolMatch) {
                            try {
                              return getToolMessage(toolMatch[1], JSON.parse(toolMatch[2]));
                            } catch (e) {}
                            return getToolMessage(toolMatch[1], {});
                          }
                        }
                        if (log.includes("fetch_emails")) return getFriendlyMessage("fetch_emails", rawLog);
                        if (log.includes("list_directory")) return getFriendlyMessage("list_directory", rawLog);
                        if (log.includes("run_git_action")) return getFriendlyMessage("run_git_action", rawLog);
                        if (log.includes("tool success")) return getFriendlyMessage("tool_success", rawLog);
                        if (log.includes("tool error")) return getFriendlyMessage("tool_error", rawLog);
                        if (log.includes("requesting completion") || log.includes("starting pipeline"))
                          return getFriendlyMessage("planning", rawLog);
                      }
                      return getFriendlyMessage("generic_processing", "fallback");
                    };
                    const currentStatus = getLoaderStatus(logs);

                    return (
                      <div className='flex gap-5 max-w-[90%] w-full animate-in fade-in slide-in-from-bottom-2 duration-500'>
                        <div className='flex-shrink-0 mt-1 relative h-10 w-10 flex items-center justify-center rounded-full'>
                          <div className='absolute inset-0 rounded-full bg-accent-cyan/20 blur-md animate-pulse'></div>
                          <div className='absolute inset-0 rounded-full border-2 border-transparent border-t-accent-cyan/90 border-b-accent-cyan/90 animate-[spin_1.5s_linear_infinite]'></div>
                          <div className='absolute inset-[-4px] rounded-full border border-transparent border-l-accent-purple/70 border-r-accent-purple/70 animate-[spin_2.5s_linear_infinite_reverse]'></div>
                          <Sparkles className='h-4 w-4 text-accent-cyan animate-pulse z-10' />
                        </div>

                        <div className='flex-1 pt-1'>
                          {/* Shimmering Text Effect */}
                          <div className='flex items-center gap-2 mb-2'>
                            <p className='text-[14px] font-medium tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan via-white to-accent-purple animate-[pulse_2s_ease-in-out_infinite]'>
                              {currentStatus}
                            </p>
                            <span className='flex gap-0.5'>
                              <span className='w-1 h-1 bg-accent-cyan/60 rounded-full animate-bounce [animation-delay:-0.3s]'></span>
                              <span className='w-1 h-1 bg-accent-cyan/60 rounded-full animate-bounce [animation-delay:-0.15s]'></span>
                              <span className='w-1 h-1 bg-accent-cyan/60 rounded-full animate-bounce'></span>
                            </span>
                          </div>

                          {/* Flowing Data Skeleton Lines */}
                          <div className='flex flex-col gap-2.5 w-full max-w-sm mt-1 opacity-70'>
                            <div className='h-1.5 w-full bg-gradient-to-r from-accent-cyan/10 via-accent-cyan/30 to-accent-cyan/10 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] bg-[length:200%_100%]'></div>
                            <div className='h-1.5 w-[85%] bg-gradient-to-r from-accent-purple/10 via-accent-purple/30 to-accent-purple/10 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] delay-150 bg-[length:200%_100%]'></div>
                            <div className='h-1.5 w-[60%] bg-gradient-to-r from-accent-cyan/10 via-accent-cyan/20 to-transparent rounded-full animate-[pulse_1.5s_ease-in-out_infinite] delay-300'></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}
          </div>

          {/* DOCK INPUT AREA */}
          <div className='absolute bottom-0 left-0 w-full pt-20 pb-8 px-4 bg-gradient-to-t from-[#08080a] via-[#08080a]/95 to-transparent pointer-events-none z-20'>
            <div className='max-w-4xl mx-auto w-full pointer-events-auto flex flex-col gap-3'>
              <div className='shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-[22px]'>
                <CommandInput onVoiceClick={() => setShowVoice(true)} />
              </div>
            </div>
          </div>
        </main>

      <Drawer open={showLogs} onOpenChange={setShowLogs}>
        <div className='flex-1 flex flex-col min-h-0 bg-[#08080a]/95 backdrop-blur-xl p-4 border-l border-white/5 shadow-2xl'>
          <Logs recentLogs={recentLogs} setShowLogs={(val) => setShowLogs(typeof val === 'function' ? val(showLogs) : val)} />
        </div>
      </Drawer>

      {showVoice && <VoiceOverlay onClose={() => setShowVoice(false)} />}
    </>
  );
}