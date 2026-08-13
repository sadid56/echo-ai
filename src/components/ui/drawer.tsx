import { Drawer as VaulDrawer } from "vaul";
import React from "react";

interface DrawerProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function Drawer({
  children,
  open,
  onOpenChange,
  title = "System Console Logs",
  description = "Echo AI autonomous task and diagnostic output stream",
}: DrawerProps) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange} direction='right'>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300' />

        <VaulDrawer.Content className='fixed right-0 top-0 bottom-0 z-50 flex w-[420px] max-w-full h-full flex-col border-l border-border-color bg-bg-secondary text-text-main shadow-2xl focus:outline-none transition-transform duration-300'>
          <div className='flex-1 overflow-hidden p-5 flex flex-col h-full relative'>
            <div className='absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-border-color/60 hover:bg-border-color transition cursor-grab' />

            <div className='pl-4 flex flex-col h-full flex-1 min-h-0'>
              <div className='flex items-center justify-between border-b border-border-color/40 pb-3 mb-4 select-none'>
                <div>
                  <VaulDrawer.Title className='text-xs font-extrabold uppercase tracking-[0.16rem] text-accent-cyan'>
                    {title}
                  </VaulDrawer.Title>
                  <VaulDrawer.Description className='text-[10px] text-text-muted mt-0.5'>{description}</VaulDrawer.Description>
                </div>
                <button
                  type='button'
                  onClick={() => onOpenChange(false)}
                  className='text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-main px-3 py-1.5 rounded-md border border-border-color/60 bg-bg-tertiary hover:bg-bg-secondary active:scale-[0.98] transition-all duration-75'
                >
                  Close
                </button>
              </div>

              <div className='flex-1 flex flex-col min-h-0 pr-1 select-text'>{children}</div>
            </div>
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}
