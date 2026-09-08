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

  const portalTarget = typeof document !== "undefined" ? document.getElementById("app-container") || document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <div className='absolute inset-0 z-55'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-md animate-dialog-fade-in' onClick={onClose} />

      <div className='absolute inset-0 flex items-center justify-center p-4 pointer-events-none'>
        <div
          className={cn(
            "w-full max-w-md rounded-[28px] border border-m3-outline-variant bg-m3-surface-container-high p-6 shadow-2xl focus:outline-none pointer-events-auto animate-dialog-scale-in",
            className,
          )}
        >
          {/* Header */}
          <div className='pb-2 mb-3 select-none'>
            <h3 className='text-xl font-normal text-m3-on-surface'>{title}</h3>
            {description && <p className='text-xs text-m3-on-surface-variant mt-1'>{description}</p>}
          </div>

          {/* Content */}
          <div className='text-xs sm:text-sm text-m3-on-surface leading-relaxed mb-5'>{children}</div>
        </div>
      </div>
    </div>,
    portalTarget,
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
      <p className='text-xs sm:text-sm text-m3-on-surface-variant leading-relaxed'>{description}</p>

      {/* Action buttons */}
      <div className='flex justify-end gap-2 mt-6'>
        <Button variant='ghost' size='sm' onClick={onClose}>
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
