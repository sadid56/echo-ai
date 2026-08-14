import { ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { cn } from "../../lib/cn";
import { motion, AnimatePresence } from "motion/react";

export type DropdownOption = {
  label: string;
  value: string;
  description?: string;
  title?: string;
  isFree?: boolean;
  models?: DropdownOption[];
};

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  triggerClassName = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 240);
    }
  }, [open]);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <Button
        type='button'
        variant='secondary'
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between text-left rounded-lg px-3.5 py-3 text-xs font-normal normal-case tracking-normal",
          triggerClassName,
        )}
      >
        <span className='flex flex-col items-start justify-center pointer-events-none overflow-hidden flex-1'>
          <span className={cn("text-xs truncate w-full", selectedOption ? "text-text-main" : "text-text-muted/70")}>
            {selectedOption?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-muted transition-transform duration-300 ease-in-out ml-3 shrink-0",
            open && "rotate-180 text-accent-cyan",
          )}
        />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute left-0 right-0 z-50 overflow-hidden",
              "rounded-xl border border-accent-cyan/20 bg-[#121217] shadow-[0_0_20px_rgba(0,240,255,0.08)]",
              "backdrop-blur-xl",
              openUpwards ? "bottom-[calc(100%+6px)] origin-bottom" : "top-[calc(100%+6px)] origin-top",
            )}
          >
            <div className='max-h-72 overflow-y-auto py-1.5 px-1.5'>
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 flex items-center justify-between border-none outline-none transition-all duration-150 relative cursor-pointer gap-2 rounded-lg my-0.5",
                      isSelected ? "bg-accent-cyan/10 text-accent-cyan" : "text-text-main hover:bg-white/[0.04] active:bg-white/[0.08]",
                    )}
                  >
                    <div className='flex flex-col items-start overflow-hidden flex-1'>
                      <span className={cn("text-xs font-semibold truncate w-full", isSelected ? "text-accent-cyan" : "text-text-main")}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className={cn("text-[10px] mt-0.5 truncate w-full", isSelected ? "text-accent-cyan/70" : "text-text-muted")}>
                          {option.description}
                        </span>
                      )}
                    </div>

                    {isSelected && <Check className='h-3.5 w-3.5 text-accent-cyan shrink-0 ml-3 animate-scaleIn' />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}