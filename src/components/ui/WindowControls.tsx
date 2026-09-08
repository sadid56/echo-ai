import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "./button";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const WindowControls = () => {
  if (!isTauri) return null;

  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let appWin: ReturnType<typeof getCurrentWindow> | null = null;
    try {
      appWin = getCurrentWindow();
    } catch (_) {
      return;
    }

    const checkMaximized = async () => {
      try {
        if (!appWin) return;
        const maximized = await appWin.isMaximized();
        setIsMaximized(maximized);
      } catch (e) {
        console.error("Failed to check maximized state:", e);
      }
    };

    checkMaximized();

    appWin
      .onResized(async () => {
        try {
          if (!appWin) return;
          const maximized = await appWin.isMaximized();
          setIsMaximized(maximized);
        } catch (e) {
          console.error("Failed to update maximized state on resize:", e);
        }
      })
      .then((fn) => {
        unlisten = fn;
      })
      .catch((e) => console.error("Failed to register resize listener:", e));

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleMinimize = () => {
    try {
      getCurrentWindow().minimize();
    } catch (_) {}
  };
  const handleMaximize = async () => {
    try {
      const win = getCurrentWindow();
      await win.toggleMaximize();
      const maximized = await win.isMaximized();
      setIsMaximized(maximized);
    } catch (_) {}
  };

  const handleClose = () => {
    try {
      getCurrentWindow().close();
    } catch (_) {}
  };

  return (
    <div className='flex items-center gap-0.5 select-none'>
      {/* Minimize Button */}
      <Button
        variant='ghost'
        size='icon'
        onClick={handleMinimize}
        className='text-text-muted hover:text-text-main hover:bg-white/[0.08] active:scale-95 transition-all duration-150'
        title='Minimize'
        aria-label='Minimize Window'
      >
        <Minus className='w-3 h-3' strokeWidth={1.5} />
      </Button>

      {/* Maximize / Restore Button */}
      <Button
        variant='ghost'
        size='icon'
        onClick={handleMaximize}
        className='text-text-muted hover:text-text-main hover:bg-white/[0.08] active:scale-95 transition-all duration-150'
        title={isMaximized ? "Restore" : "Maximize"}
        aria-label={isMaximized ? "Restore Window" : "Maximize Window"}
      >
        {isMaximized ? (
          <Minimize2 className='w-3 h-3' strokeWidth={1.5} />
        ) : (
          <Maximize2 className='w-3 h-3' strokeWidth={1.5} />
        )}
      </Button>

      {/* Close Button */}
      <Button
        variant='ghost'
        size='icon'
        onClick={handleClose}
        className='text-text-muted hover:text-white hover:bg-rose-500/90 active:scale-95 transition-all duration-150'
        title='Close'
        aria-label='Close Window'
      >
        <X className='w-3 h-3' strokeWidth={1.5} />
      </Button>
    </div>
  );
};
