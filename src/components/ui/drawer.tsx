import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./button";

interface DrawerProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  hideHeader?: boolean;
  side?: "left" | "right";
}

export function Drawer({
  children,
  open,
  onOpenChange,
  title,
  description,
  hideHeader = false,
  side = "right",
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const portalTarget = typeof document !== "undefined" ? document.getElementById("app-container") || document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <div
      className={`absolute inset-0 z-50 transition-all duration-300 rounded-[inherit] overflow-hidden pointer-events-none ${
        open ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop Overlay */}
      <div
        onClick={() => onOpenChange(false)}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 rounded-[inherit] ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      />

      {/* Drawer Panel - Material 3 Navigation Drawer */}
      <div
        className={`absolute z-50 flex w-[320px] sm:w-[380px] max-w-[85vw] flex-col bg-m3-surface-container-low shadow-2xl transition-transform duration-300 ease-out overflow-hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        } ${
          side === "left"
            ? `-top-px -bottom-px -left-px h-[calc(100%+2px)] border-r border-m3-outline-variant rounded-r-[28px] rounded-l-[inherit] ${open ? "translate-x-0" : "-translate-x-full"}`
            : `-top-px -bottom-px -right-px h-[calc(100%+2px)] border-l border-m3-outline-variant rounded-l-[28px] rounded-r-[inherit] ${open ? "translate-x-0" : "translate-x-full"}`
        }`}
      >
        <div 
          style={{ 
            paddingTop: "calc(var(--safe-top) + 0.75rem)", 
            paddingBottom: "calc(var(--safe-bottom) + 0.75rem)" 
          }}
          className='flex-1 overflow-hidden px-4 flex flex-col h-full'
        >
          {!hideHeader && (
            <div className='flex items-center justify-between border-b border-m3-outline-variant pb-3 mb-3 select-none'>
              <div>
                <h3 className='text-sm font-semibold tracking-tight text-m3-on-surface'>
                  {title}
                </h3>
                {description && (
                  <p className='text-xs text-m3-on-surface-variant mt-0.5'>{description}</p>
                )}
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => onOpenChange(false)}
                title='Close'
                aria-label='Close drawer'
              >
                <X className='w-4.5 h-4.5' />
              </Button>
            </div>
          )}

          <div className='flex-1 flex flex-col min-h-0 select-text'>{children}</div>
        </div>
      </div>
    </div>,
    portalTarget
  );
}
