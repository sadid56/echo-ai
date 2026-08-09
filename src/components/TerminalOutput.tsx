import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/chatStore";

export const TerminalOutput = () => {
  const { logs, clearLogs } = useChatStore();
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (isOpen) {
      terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  return (
    <div className={`terminal-container ${isOpen ? "expanded" : "collapsed"}`}>
      <div className="terminal-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="terminal-title">
          <span className="status-dot green animate-pulse"></span>
          <span>Real-time Execution Terminal (Rust & Sidecar)</span>
        </div>
        <div className="terminal-controls" onClick={(e) => e.stopPropagation()}>
          <button className="terminal-control-btn" onClick={clearLogs}>Clear Logs</button>
          <button className="terminal-control-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="terminal-body">
          {logs.length === 0 ? (
            <div className="terminal-empty-text">No logs generated. Send a prompt to watch execution processes...</div>
          ) : (
            logs.map((log, idx) => {
              let colorClass = "log-default";
              if (log.includes("[Orchestrator]")) colorClass = "log-orchestrator";
              else if (log.includes("[AI Response]")) colorClass = "log-ai";
              else if (log.includes("[Tool Success]")) colorClass = "log-success";
              else if (log.includes("[Tool Error]") || log.includes("[Orchestrator Err]") || log.includes("[Python Err]")) colorClass = "log-error";
              else if (log.includes("[Python]")) colorClass = "log-python";
              else if (log.includes("[Rust Orchestrator]")) colorClass = "log-rust";

              return <div key={idx} className={`log-line ${colorClass}`}>{log}</div>;
            })
          )}
          <div ref={terminalBottomRef} />
        </div>
      )}
    </div>
  );
};
