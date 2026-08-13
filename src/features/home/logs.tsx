import type { Dispatch, SetStateAction } from "react";
import { ChevronRight } from "lucide-react";

type LogsProps = {
  setShowLogs: Dispatch<SetStateAction<boolean>>;
  recentLogs: string[];
};

const Logs = ({ setShowLogs, recentLogs }: LogsProps) => {
  return (
    <aside className='w-full flex-1 flex flex-col border border-border-color/30 bg-[#0b1017] rounded-xl overflow-hidden z-20 min-h-0'>
      <div className='flex items-center justify-between px-4 py-3 border-b border-border-color bg-[#101820] select-none'>
        <div className='flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-text-muted'>
          <span className='flex items-center gap-1.5'>
            <span className='h-2.5 w-2.5 rounded-full bg-[#ff5f57]' />
            <span className='h-2.5 w-2.5 rounded-full bg-[#febc2e]' />
            <span className='h-2.5 w-2.5 rounded-full bg-[#28c840]' />
          </span>
          <span className='ml-2 text-accent-cyan'>terminal</span>
        </div>

        <button
          className='text-text-muted hover:text-text-main text-xl cursor-pointer bg-transparent border-none outline-none leading-none'
          onClick={() => setShowLogs(false)}
        >
          ×
        </button>
      </div>

      <div className='flex-1 overflow-y-auto bg-[#0b1017] px-3 py-3 font-mono text-[11px] leading-6 text-text-main min-h-0'>
        <div className='space-y-1'>
          {recentLogs.length === 0 ? (
            <div className='px-2 py-5 text-center text-text-muted'>No browser or system activity yet.</div>
          ) : (
            recentLogs.map((entry, index) => (
              <div key={`${entry}-${index}`} className='flex items-start gap-2 pl-2 py-1 text-[#dbeafe] animate-float-in min-w-0'>
                <span className='text-accent-cyan/80 select-none flex-shrink-0 mt-1.5'>
                  <ChevronRight size={14} />
                </span>
                <pre className='flex-1 min-w-0 whitespace-pre-wrap break-all font-mono text-[11px] leading-5 text-[#e5eefb]'>{entry}</pre>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default Logs;
