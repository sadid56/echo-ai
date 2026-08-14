import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ScrollText, Settings, Trash2, Home } from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { AlertDialog } from "../components/ui/dialog";
import { WindowControls } from "../components/ui/WindowControls";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearChat, showLogs, setShowLogs } = useChatStore();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const isSettings = location.pathname.includes("/settings");

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.button === 0 &&
      !(e.target as HTMLElement).closest("button") &&
      !(e.target as HTMLElement).closest("input") &&
      !(e.target as HTMLElement).closest("a")
    ) {
      appWindow.startDragging();
    }
  };

  return (
    <header 
      data-tauri-drag-region 
      onMouseDown={handleMouseDown}
      className='flex justify-between items-center px-8 py-4 bg-bg-glass backdrop-blur-md border-b border-border-color z-10 select-none cursor-default active:cursor-grabbing'
    >
      {/* Left Area: Logo */}
      <div className='flex items-center gap-4'>
        {/* Logo & Brand */}
        <div 
          className='flex items-center gap-2.5 select-none cursor-pointer' 
          onClick={() => navigate("/")}
        >
          <img 
            src="/echo_logo.png" 
            alt="Echo AI Logo" 
            className="w-6 h-6 rounded-full border border-accent-cyan/20 object-cover shadow-[0_0_8px_rgba(0,240,255,0.15)]" 
          />
          <h1 className='text-lg font-extrabold tracking-widest bg-gradient-to-r from-text-main to-accent-cyan bg-clip-text text-transparent font-sans'>
            E C H O
          </h1>
        </div>
      </div>

      {/* Right Area: Action Buttons & Window Controls */}
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-1 bg-white/[0.02] border border-white/[0.05] p-1 rounded-full backdrop-blur-sm shadow-[inset_0_0_12px_rgba(255,255,255,0.02)] select-none'>
          {isSettings ? (
            <>
              <button
                type='button'
                onClick={() => navigate("/")}
                className='p-2 rounded-full text-text-muted hover:text-white hover:bg-white/[0.03] active:bg-white/[0.06] transition-all duration-150 cursor-pointer outline-none'
                title="Go to Chat"
              >
                <Home className='w-4 h-4' strokeWidth={1.8} />
              </button>

              <div className='w-[1px] h-3.5 bg-white/10' />

              <button
                type='button'
                className='p-2 rounded-full text-accent-cyan bg-accent-cyan/10 shadow-[0_0_10px_rgba(0,240,255,0.15)] outline-none cursor-default'
                title="AI Settings (Active)"
              >
                <Settings className='w-4 h-4' strokeWidth={1.8} />
              </button>
            </>
          ) : (
            <>
              <button
                type='button'
                onClick={() => setConfirmClearOpen(true)}
                className='p-2 rounded-full text-text-muted hover:text-rose-400 hover:bg-white/[0.03] active:bg-white/[0.06] transition-all duration-150 cursor-pointer outline-none'
                title="Clear Chat Context"
              >
                <Trash2 className='w-4 h-4' strokeWidth={1.8} />
              </button>
              
              <div className='w-[1px] h-3.5 bg-white/10' />

              <button
                type='button'
                onClick={() => setShowLogs(!showLogs)}
                className={`p-2 rounded-full transition-all duration-150 cursor-pointer outline-none ${
                  showLogs 
                    ? "text-accent-cyan bg-accent-cyan/10 shadow-[0_0_10px_rgba(0,240,255,0.15)]" 
                    : "text-text-muted hover:text-accent-cyan hover:bg-white/[0.03] active:bg-white/[0.06]"
                }`}
                title="System Logs"
              >
                <ScrollText className='w-4 h-4' strokeWidth={1.8} />
              </button>

              <div className='w-[1px] h-3.5 bg-white/10' />

              <button
                type='button'
                onClick={() => navigate("/settings")}
                className='p-2 rounded-full text-text-muted hover:text-white hover:bg-white/[0.03] active:bg-white/[0.06] transition-all duration-150 group cursor-pointer outline-none'
                title="AI Settings"
              >
                <Settings className='w-4 h-4 transition-transform duration-500 group-hover:rotate-45' strokeWidth={1.8} />
              </button>
            </>
          )}
        </div>

        {/* Divider */}
        <div className='w-[1px] h-5 bg-white/10 mx-1' />

        {/* Window Controls */}
        <WindowControls />
      </div>

      <AlertDialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title='Clear Chat History?'
        description='This will clear the current conversational context memory. This action cannot be undone.'
        confirmLabel='Clear Memory'
        cancelLabel='Cancel'
        onConfirm={clearChat}
        variant='destructive'
      />
    </header>
  );
};

export default Header;
