import type { Dispatch, SetStateAction } from "react";

import { useChatStore } from "../../store/chatStore";

type LogsProps = {
  setShowLogs: Dispatch<SetStateAction<boolean>>;
  recentLogs: string[];
};

const parseLogEntry = (entry: string) => {
  const match = entry.match(/^\[([^\]]+)\]\s*(?:\[([^\]]+)\])?\s*(.*)$/s);
  if (!match) {
    return { time: null, tag: null, message: entry };
  }
  return {
    time: match[1],
    tag: match[2] || null,
    message: match[3],
  };
};

const getTagStyle = (tag: string) => {
  const normalized = tag.toLowerCase();
  if (normalized.includes("success")) {
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
  }
  if (normalized.includes("error") || normalized.includes("fail")) {
    return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
  }
  if (normalized.includes("response") || normalized.includes("ai")) {
    return "bg-purple-500/10 text-purple-300 border border-purple-500/25";
  }
  if (normalized.includes("orchestrator")) {
    return "bg-amber-500/10 text-amber-300 border border-amber-500/25";
  }
  if (normalized.includes("scheduler")) {
    return "bg-blue-500/10 text-blue-300 border border-blue-500/25";
  }
  if (normalized.includes("browser") || normalized.includes("tool")) {
    return "bg-cyan-500/10 text-cyan-300 border border-cyan-500/25";
  }
  return "bg-zinc-500/10 text-zinc-300 border border-zinc-500/25";
};

const HighlightedMessage = ({ text }: { text: string }) => {
  const parts = text.split(/('[^']+'|`[^`]+`|\b\d+\b)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if ((part.startsWith("'") && part.endsWith("'")) || (part.startsWith("`") && part.endsWith("`"))) {
          return (
            <span key={i} className='text-amber-200/90 font-semibold'>
              {part}
            </span>
          );
        }
        if (/^\d+$/.test(part)) {
          return (
            <span key={i} className='text-cyan-300 font-medium'>
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
};

const Logs = ({ setShowLogs, recentLogs }: LogsProps) => {
  const clearLogs = useChatStore((state) => state.clearLogs);

  return (
    <aside className='w-full flex-1 flex flex-col border border-border-color/40 bg-[#080c11] rounded-xl overflow-hidden z-20 min-h-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]'>
      <div className='flex items-center justify-between px-3 py-2 border-b border-border-color/40 bg-white/[0.01] select-none'>
        <span className='text-[9px] uppercase tracking-wider text-text-muted font-semibold font-mono'>Terminal Stream</span>
        <button
          type='button'
          onClick={clearLogs}
          className='text-[9px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 px-2 py-1 rounded border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 active:scale-[0.98] transition-all duration-75 cursor-pointer'
        >
          Clear Logs
        </button>
      </div>
      <div className='flex-1 overflow-y-auto py-3 px-2 text-[11px] font-mono leading-relaxed min-h-0 custom-scrollbar'>
        <div className='space-y-2'>
          {recentLogs.length === 0 ? (
            <div className='px-3 py-8 text-center text-text-muted/60 italic font-sans'>
              No system activity or execution logs recorded yet.
            </div>
          ) : (
            recentLogs.map((entry, index) => {
              const { time, tag, message } = parseLogEntry(entry);
              return (
                <div
                  key={`${entry}-${index}`}
                  className='flex flex-col gap-1.5 p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] hover:border-white/[0.04] transition-all duration-150 group animate-float-in'
                >
                  <div className='flex items-center gap-2 text-[9px] font-mono select-none'>
                    {time && (
                      <span className='text-zinc-500 group-hover:text-zinc-400 transition-colors duration-150'>
                        [{time}]
                      </span>
                    )}
                    {tag && (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold ${getTagStyle(tag)}`}>
                        {tag}
                      </span>
                    )}
                  </div>
                  <div className='text-[11.5px] leading-relaxed text-zinc-300 group-hover:text-white/95 transition-colors duration-150 break-words whitespace-pre-wrap pl-0.5'>
                    <HighlightedMessage text={message} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};

export default Logs;
