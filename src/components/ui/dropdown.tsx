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
      <Button type='button' variant='secondary' size='md' onClick={() => setOpen((prev) => !prev)} className={triggerClassName}>
        <span className='flex flex-col items-start'>
          <span className='font-medium text-text-main'>{selectedOption?.label ?? placeholder}</span>
          {selectedOption?.description && <span className='text-[10px] text-text-muted'>{selectedOption.description}</span>}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className='absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-border-color bg-bg-secondary shadow-2xl'>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <Button
                key={option.value}
                type='button'
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                variant={isSelected ? "primary" : "secondary"}
              >
                <span className='text-sm font-semibold text-text-main'>{option.label}</span>
                {option.description && <span className='text-[10px] text-text-muted'>{option.description}</span>}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
