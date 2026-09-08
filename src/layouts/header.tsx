import { useNavigate, useLocation } from "react-router-dom";
import { ScrollText, Settings, Home, Menu, ChevronLeft } from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { WindowControls } from "../components/ui/WindowControls";
import { Button } from "../components/ui/button";
import { getCurrentWindow } from "@tauri-apps/api/window";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    showLogs, 
    setShowLogs, 
    showHistory, 
    setShowHistory, 
    activeSessionId, 
    sessions 
  } = useChatStore();
  const isSettings = location.pathname.includes("/settings");
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      isTauri &&
      e.button === 0 &&
      !(e.target as HTMLElement).closest("button") &&
      !(e.target as HTMLElement).closest("input") &&
      !(e.target as HTMLElement).closest("a")
    ) {
      try {
        getCurrentWindow().startDragging();
      } catch (_) {}
    }
  };

  return (
    <header 
      data-tauri-drag-region 
      onMouseDown={handleMouseDown}
      style={{ paddingTop: "calc(var(--safe-top) + 0.5rem)" }}
      className='flex justify-between items-center px-3 sm:px-6 pb-2.5 bg-m3-surface-container-low/95 backdrop-blur-md border-b border-m3-outline-variant z-30 select-none'
    >
      {/* Left Area */}
      {isSettings ? (
        <div className='flex items-center gap-2 sm:gap-3'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => navigate("/")}
            title='Back to chat'
          >
            <ChevronLeft className='w-5 h-5' />
          </Button>
          <h1 className='text-base sm:text-lg font-bold tracking-tight text-m3-on-surface font-sans'>
            Settings
          </h1>
        </div>
      ) : (
        <div className='flex items-center gap-2 sm:gap-3'>
          {/* Navigation Drawer Button with 40px touch target */}
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setShowHistory(!showHistory)}
            title='Open Chat Drawer'
            aria-label='Open Navigation Drawer'
          >
            <Menu className='w-5 h-5 sm:w-4.5 sm:h-4.5' strokeWidth={2} />
          </Button>

          {/* Logo & Brand */}
          <div 
            className='flex items-center gap-2.5 select-none cursor-pointer' 
            onClick={() => navigate("/")}
          >
            <img 
              src="/echo_logo.png" 
              alt="Echo AI Logo" 
              className="w-7 h-7 rounded-full border border-m3-outline-variant object-cover" 
            />
            <h1 className='text-base sm:text-lg font-semibold tracking-tight text-m3-on-surface font-sans'>
              Echo AI
            </h1>
          </div>

          {activeSession && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-m3-outline-variant text-xs text-m3-on-surface-variant/80 max-w-[200px]">
              <span className="truncate" title={activeSession.title}>
                {activeSession.title}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Right Area: M3 Action Bar & Window Controls */}
      <div className='flex items-center gap-1.5 sm:gap-3'>
        {isSettings ? (
          <Button
            variant='secondary'
            size='sm'
            onClick={() => navigate("/")}
            title="Go to Chat"
            className='gap-1.5'
          >
            <Home className='w-3.5 h-3.5' strokeWidth={1.8} />
            <span>Chat</span>
          </Button>
        ) : (
          <div className='flex items-center gap-1 bg-m3-surface-container border border-m3-outline-variant p-1 rounded-full shadow-sm select-none'>
            {/* Logs Drawer Toggle */}
            <Button
              variant={showLogs ? "secondary" : "ghost"}
              size='icon'
              onClick={() => setShowLogs(!showLogs)}
              className={showLogs ? "text-m3-primary bg-m3-primary/15" : ""}
              title="System Logs"
            >
              <ScrollText className='w-4 h-4' strokeWidth={1.8} />
            </Button>

            <div className='w-[1px] h-4 bg-white/10' />

            {/* Settings */}
            <Button
              variant='ghost'
              size='icon'
              onClick={() => navigate("/settings")}
              title="AI Settings"
              className='group'
            >
              <Settings className='w-4 h-4 transition-transform duration-500 group-hover:rotate-45' strokeWidth={1.8} />
            </Button>
          </div>
        )}

        {/* Desktop Window Controls (hidden on mobile/Android viewports) */}
        <div className='hidden md:flex items-center gap-2'>
          <div className='w-[1px] h-4 bg-white/10 mx-0.5' />
          <WindowControls />
        </div>
      </div>
    </header>
  );
};

export default Header;
