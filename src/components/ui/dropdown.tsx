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
          "w-full flex items-center justify-between text-left rounded-[16px] px-4 py-3 text-xs sm:text-sm font-normal normal-case tracking-normal bg-m3-surface-container-low border border-m3-outline-variant text-m3-on-surface hover:border-m3-outline",
          triggerClassName,
        )}
      >
        <span className='flex flex-col items-start justify-center pointer-events-none overflow-hidden flex-1'>
          <span className={cn("text-xs sm:text-sm truncate w-full", selectedOption ? "text-m3-on-surface font-medium" : "text-m3-on-surface-variant")}>
            {selectedOption?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-m3-on-surface-variant transition-transform duration-200 ease-in-out ml-3 shrink-0",
            open && "rotate-180 text-m3-primary",
          )}
        />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute left-0 right-0 z-50 overflow-hidden",
              "rounded-[18px] border border-m3-outline-variant bg-m3-surface-container shadow-xl",
              "backdrop-blur-md",
              openUpwards ? "bottom-[calc(100%+6px)] origin-bottom" : "top-[calc(100%+6px)] origin-top",
            )}
          >
            <div className='max-h-72 overflow-y-auto py-1.5 px-1.5'>
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <Button
                    key={option.value}
                    variant={isSelected ? "secondary" : "ghost"}
                    fullWidth
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "justify-between text-left px-3.5 py-2.5 h-auto rounded-[12px] my-0.5 border-0 font-normal",
                      isSelected ? "bg-m3-secondary-container text-m3-on-secondary-container font-medium" : "text-m3-on-surface",
                    )}
                  >
                    <div className='flex flex-col items-start overflow-hidden flex-1'>
                      <span className={cn("text-xs font-medium truncate w-full", isSelected ? "text-m3-on-secondary-container" : "text-m3-on-surface")}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className={cn("text-[10px] mt-0.5 truncate w-full", isSelected ? "text-m3-on-secondary-container/70" : "text-m3-on-surface-variant")}>
                          {option.description}
                        </span>
                      )}
                    </div>

                    {isSelected && <Check className='h-3.5 w-3.5 text-m3-primary shrink-0 ml-3 animate-scaleIn' />}
                  </Button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}