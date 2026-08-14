import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className = "" }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className='fixed inset-0 z-55'>
      <div className='fixed inset-0 bg-black/60 backdrop-blur-md animate-dialog-fade-in' onClick={onClose} />

      <div className='fixed inset-0 flex items-center justify-center p-4 pointer-events-none'>
        <div
          className={cn(
            "w-full max-w-md rounded-xl border border-border-color bg-bg-secondary p-5 shadow-2xl focus:outline-none pointer-events-auto animate-dialog-scale-in",
            className,
          )}
        >
          {/* Header */}
          <div className='border-b border-border-color/30 pb-3 mb-4 select-none'>
            <h3 className='text-xl font-medium text-accent-cyan'>{title}</h3>
            {description && <p className='text-[10px] text-text-muted mt-0.5'>{description}</p>}
          </div>

          {/* Content */}
          <div className='text-xs text-text-main leading-relaxed mb-5'>{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "info" | "destructive";
}

export function AlertDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "info",
}: AlertDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} title={title} className='max-w-sm'>
      <p className='text-xs text-text-muted'>{description}</p>

      {/* Action buttons */}
      <div className='flex justify-end gap-2.5 mt-5'>
        <Button variant='secondary' size='sm' onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "destructive" ? "error" : "primary"}
          size='sm'
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
