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
import { cn } from "../lib/cn";

const formatTokens = (tokens: number) => {
  if (tokens >= 1000000) {
    return (tokens / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (tokens >= 1000) {
    return (tokens / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return tokens.toString();
};

export function HomeScreen() {
  const [showVoice, setShowVoice] = useState(false);
  const [isMobileKeyboardActive, setIsMobileKeyboardActive] = useState(false);
  const { config, messages, logs, loading, showLogs, setShowLogs } = useChatStore();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [dockHeight, setDockHeight] = useState(280);

  const words = ["AI assistant", "code wizard", "dev companion", "smart copilot", "agentic helper"];

  // Mobile virtual keyboard detection (strictly on touch devices only)
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    if (!isTouch) return; // Desktop is completely unaffected

    const handleViewportResize = () => {
      if (!window.visualViewport) return;
      const isShrunk = window.visualViewport.height < window.innerHeight - 120;
      setIsMobileKeyboardActive(isShrunk);
    };

    window.visualViewport.addEventListener("resize", handleViewportResize);
    return () => window.visualViewport?.removeEventListener("resize", handleViewportResize);
  }, []);

  useEffect(() => {
    if (!dockRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setDockHeight(height);
        }
      }
    });
    observer.observe(dockRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: "smooth" });
    }
  }, [messages, logs, loading, dockHeight]);

  const recentLogs = logs.slice(-10).reverse();

  return (
    <>
      <main className='flex flex-col flex-1 overflow-hidden relative'>
        <div 
          ref={scrollRef} 
          className='flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 scroll-smooth transition-[padding-bottom] duration-200 ease-out'
          style={{ paddingBottom: `${Math.max(dockHeight + 12, isMobileKeyboardActive ? 180 : 260)}px` }}
        >
            {messages.length === 0 ? (
              /* M3 SWEET SPOT AI HERO - Clean, Centered & Fluid */
              <div className={cn(
                "flex flex-col items-center justify-center h-full transition-all duration-300 ease-out py-6 px-3 select-none",
                isMobileKeyboardActive ? "space-y-3" : "space-y-6 sm:space-y-8"
              )}>
                {/* Echo AI Avatar */}
                <div className={cn(
                  "relative flex items-center justify-center transition-all duration-300 ease-out origin-center",
                  isMobileKeyboardActive 
                    ? "h-0 max-h-0 opacity-0 scale-75 overflow-hidden my-0" 
                    : "h-20 w-20 sm:h-24 sm:w-24 opacity-100 scale-100"
                )}>
                  <div className='h-full w-full rounded-full bg-m3-surface-container-high border border-m3-outline-variant flex items-center justify-center p-2 shadow-sm transition-transform duration-300 group-hover:scale-105'>
                    <img 
                      src="/echo_logo.png" 
                      alt="Echo AI" 
                      className="h-full w-full object-cover rounded-full border border-m3-outline-variant/60" 
                    />
                  </div>
                </div>

                <div className='text-center space-y-2 sm:space-y-2.5 z-10 max-w-sm px-2'>
                  <h1 className='text-base sm:text-xl font-normal tracking-tight text-m3-on-surface min-h-[26px] sm:min-h-[30px]'>
                    Echo is your personal{" "}
                    <FlipWords duration={3000} words={words} className='text-m3-primary font-medium w-[120px] sm:w-[130px] inline-block text-left whitespace-nowrap' />
                  </h1>
                  <p className={cn(
                    "text-xs sm:text-sm text-m3-on-surface-variant max-w-xs sm:max-w-sm mx-auto leading-relaxed transition-opacity duration-200",
                    isMobileKeyboardActive && "hidden xs:block"
                  )}>
                    Ask questions, run commands, search the web, or manage files.
                  </p>
                </div>
              </div>
            ) : (
              /* CONVERSATION FEED */
              <div className='mx-auto flex max-w-4xl flex-col gap-6 sm:gap-8 pb-10'>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex w-full animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "user" ? (
                      <div className='group relative max-w-[90%] sm:max-w-[80%] md:max-w-[75%]'>
                        <div className='text-[14.5px] sm:text-[15px] leading-relaxed relative z-10 p-3.5 sm:p-4 bg-m3-surface-container-high border border-m3-outline-variant text-m3-on-surface rounded-[24px] rounded-tr-md shadow-sm'>
                          <CustomMarkdown content={message.content} />

                          {/* Message Attachments rendering */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className='flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-m3-outline-variant'>
                              {message.attachments.map((att, idx) => (
                                <div 
                                  key={idx} 
                                  className='flex items-center gap-1.5 px-3 py-1 bg-m3-surface-container border border-m3-outline-variant rounded-full text-[11px] text-m3-on-surface-variant'
                                >
                                  {att.mime_type.startsWith("image/") ? (
                                    <img 
                                      src={`data:${att.mime_type};base64,${att.data}`} 
                                      alt={att.name} 
                                      className='w-4.5 h-4.5 rounded-full object-cover' 
                                    />
                                  ) : (
                                    <File className='w-3.5 h-3.5 text-m3-primary' />
                                  )}
                                  <span className='max-w-[100px] truncate'>{att.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className='flex gap-3 sm:gap-4 max-w-[98%] sm:max-w-[92%] md:max-w-[90%] w-full'>
                        <div className='flex-shrink-0 mt-0.5 relative h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-m3-surface-container-high border border-m3-outline-variant shadow-sm'>
                          <Bot className='h-4 w-4 text-m3-primary' />
                        </div>
                        <div className='flex-1 space-y-1.5 min-w-0'>
                          <div className='flex items-center gap-3'>
                            <span className='text-[13px] font-medium text-m3-primary tracking-normal'>
                              {message.model ?? config?.text_model?.model_name ?? "Echo"}
                            </span>
                            <span className='text-[11px] text-m3-on-surface-variant/80 tracking-normal'>
                              {message.timestamp}
                              {message.tokens_used !== undefined && message.tokens_used > 0 && ` • ${formatTokens(message.tokens_used)} tokens`}
                            </span>
                          </div>

                          <CustomMarkdown content={message.content} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* ADVANCED AI PROCESSING / THINKING STATE - MATERIAL 3 */}
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
                      <div className='flex gap-3.5 max-w-[90%] w-full animate-in fade-in slide-in-from-bottom-2 duration-300'>
                        <div className='flex-shrink-0 mt-0.5 relative h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-m3-surface-container-high border border-m3-outline-variant shadow-xs'>
                          <Sparkles className='h-4 w-4 text-m3-primary animate-pulse' />
                        </div>

                        <div className='flex-1 pt-0.5 space-y-2'>
                          <div className='flex items-center gap-2'>
                            <p className='text-xs sm:text-sm font-medium text-m3-on-surface tracking-normal'>
                              {currentStatus}
                            </p>
                            <span className='flex gap-1'>
                              <span className='w-1.5 h-1.5 bg-m3-primary/70 rounded-full animate-bounce [animation-delay:-0.3s]'></span>
                              <span className='w-1.5 h-1.5 bg-m3-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]'></span>
                              <span className='w-1.5 h-1.5 bg-m3-primary/70 rounded-full animate-bounce'></span>
                            </span>
                          </div>

                          {/* Material 3 Indeterminate Linear Progress Indicator */}
                          <div className='h-1 w-36 sm:w-48 rounded-full bg-m3-surface-container-highest overflow-hidden relative'>
                            <div className='h-full bg-m3-primary/80 rounded-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]' />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}
          </div>

          {/* DOCK INPUT AREA */}
          <div 
            ref={dockRef}
            style={{ paddingBottom: "calc(var(--safe-bottom) + 0.75rem)" }}
            className='absolute bottom-0 left-0 w-full pt-6 sm:pt-10 px-2.5 sm:px-4 bg-gradient-to-t from-m3-surface via-m3-surface/95 to-transparent pointer-events-none z-20'
          >
            <div className='max-w-4xl mx-auto w-full pointer-events-auto flex flex-col gap-2'>
              <CommandInput 
                onVoiceClick={() => setShowVoice(true)} 
              />
            </div>
          </div>
        </main>

      <Drawer title="System Logs" description="Real-time AI execution logs & event traces" hideHeader open={showLogs} onOpenChange={setShowLogs}>
        <div className='flex-1 flex flex-col min-h-0 shadow-2xl'>
          <Logs recentLogs={recentLogs} setShowLogs={(val) => setShowLogs(typeof val === 'function' ? val(showLogs) : val)} />
        </div>
      </Drawer>

      {showVoice && <VoiceOverlay onClose={() => setShowVoice(false)} />}
    </>
  );
}