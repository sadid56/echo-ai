import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollText, Settings, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useChatStore } from "../store/chatStore";
import { AlertDialog } from "../components/ui/dialog";
import { WindowControls } from "../components/ui/WindowControls";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

const Header = () => {
  const navigate = useNavigate();
  const { clearChat, showLogs, setShowLogs } = useChatStore();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

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
        <div className='flex items-center gap-2.5'>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmClearOpen(true)}
            title="Clear chat context"
          >
            <Trash2 className='w-4 h-4 mr-1.5' strokeWidth={2} />
            Clear
          </Button>

          <Button
            variant={showLogs ? "primary" : "secondary"}
            size="sm"
            className={showLogs ? "shadow-[0_0_15px_rgba(0,240,255,0.25)] border-accent-cyan/40 bg-accent-cyan/15 text-accent-cyan" : ""}
            onClick={() => setShowLogs(!showLogs)}
          >
            <ScrollText className='w-4 h-4 mr-1.5' strokeWidth={2} />
            Logs
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="group"
            onClick={() => navigate("/settings")}
          >
            <Settings className='w-4 h-4 mr-1.5 transition-transform duration-500 group-hover:rotate-90' strokeWidth={2} />
            Settings
          </Button>
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
