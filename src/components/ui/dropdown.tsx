import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { cn } from "../../lib/cn";

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

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Button
        type='button'
        variant='secondary'
        size='md'
        onClick={() => setOpen((prev) => !prev)}
        className={cn("w-full flex items-center justify-between text-left", triggerClassName)}
      >
        <span className='flex flex-col items-start'>
          <span className='font-bold text-text-main text-xs'>{selectedOption?.label ?? placeholder}</span>
          {selectedOption?.description && <span className='text-[9.5px] font-semibold text-text-muted mt-0.5'>{selectedOption.description}</span>}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform duration-75 ml-2", open && "rotate-180")} />
      </Button>

      {open && (
        <div className='absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-y-auto max-h-60 rounded-md border border-border-color bg-bg-secondary shadow-lg py-1 animate-fadeIn'>
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
                  "w-full text-left px-3.5 py-2 flex flex-col justify-start items-start border-none outline-none transition-all duration-75",
                  isSelected
                    ? "bg-accent-cyan/15 text-accent-cyan font-bold border-l-2 border-accent-cyan pl-2.5"
                    : "text-text-main hover:bg-bg-tertiary/80 active:bg-bg-tertiary"
                )}
              >
                <span className='text-xs font-bold'>{option.label}</span>
                {option.description && (
                  <span className={cn(
                    "text-[9px] font-semibold mt-0.5",
                    isSelected ? "text-accent-cyan/80" : "text-text-muted"
                  )}>
                    {option.description}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
