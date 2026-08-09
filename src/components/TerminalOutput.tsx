import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/chatStore";

export const TerminalOutput = () => {
  const { logs, clearLogs } = useChatStore();
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const copyLogs = () => {
    if (logs.length === 0) return;
    const fullLogText = logs.join("\n");
    navigator.clipboard.writeText(fullLogText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getLogColorClass = (log: string) => {
    if (log.includes("[Orchestrator]")) return "text-accent-cyan";
    if (log.includes("[AI Response]")) return "text-accent-purple";
    if (log.includes("[Tool Success]")) return "text-accent-green";
    if (log.includes("[Tool Error]") || log.includes("[Orchestrator Err]") || log.includes("[Python Err]") || log.includes("[Err]")) return "text-accent-red font-semibold";
    if (log.includes("[Python]")) return "text-accent-orange";
    if (log.includes("[Rust Orchestrator]")) return "text-accent-blue";
    return "text-text-muted";
  };

  return (
    <div className="overflow-hidden bg-bg-secondary flex flex-col h-full w-full flex-1">
      <div className="flex justify-between items-center px-4 py-3 bg-bg-tertiary border-b border-border-color/50 select-none text-[11px] font-mono text-text-muted shrink-0">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-green shadow-[0_0_8px_#10b981] animate-pulse"></span>
          <span>Real-time Execution Terminal (Rust & Sidecar)</span>
        </div>
        <div className="flex items-center gap-3.5">
          <button 
            className={`hover:text-text-main bg-transparent border-none text-[10px] font-mono tracking-wider cursor-pointer transition-all ${copied ? "text-accent-green font-semibold" : "text-text-muted hover:underline"}`} 
            onClick={copyLogs}
          >
            {copied ? "✓ Copied" : "Copy Logs"}
          </button>
          <button className="hover:text-text-main hover:underline bg-transparent border-none text-text-muted text-[10px] font-mono tracking-wider cursor-pointer transition-all" onClick={clearLogs}>Clear Logs</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-bg-primary/55 font-mono text-[10.5px] leading-relaxed flex flex-col gap-2">
        {logs.length === 0 ? (
          <div className="text-text-muted/60 italic py-6 text-center">No logs generated. Send a prompt to watch execution processes...</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className={`whitespace-pre-wrap ${getLogColorClass(log)}`}>
              {log}
            </div>
          ))
        )}
        <div ref={terminalBottomRef} />
      </div>
    </div>
  );
};
