import React, { useRef } from "react";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "./button";

interface TextFieldProps<TFieldValues extends FieldValues = Record<string, any>> {
  name?: Path<TFieldValues>;
  label?: string;
  type?: "text" | "password" | "email" | "number";
  placeholder?: string;
  register?: UseFormRegister<TFieldValues>;
  className?: string;
  rows?: number;
  textarea?: boolean;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  min?: number;
  max?: number;
}

export function TextField<TFieldValues extends FieldValues = Record<string, any>>({
  name,
  label,
  type = "text",
  placeholder = " ",
  register,
  className = "",
  rows,
  textarea = false,
  value,
  onChange,
  min,
  max,
}: TextFieldProps<TFieldValues>) {
  const registeredField = register && name ? register(name) : null;
  const localRef = useRef<HTMLInputElement | null>(null);

  const setRefs = (el: HTMLInputElement | null) => {
    localRef.current = el;
    if (registeredField && typeof registeredField.ref === "function") {
      registeredField.ref(el);
    }
  };

  const handleIncrement = () => {
    const el = localRef.current;
    if (el) {
      el.stepUp();
      const event = new Event("input", { bubbles: true });
      el.dispatchEvent(event);
    }
  };

  const handleDecrement = () => {
    const el = localRef.current;
    if (el) {
      el.stepDown();
      const event = new Event("input", { bubbles: true });
      el.dispatchEvent(event);
    }
  };

  const baseInputClasses = `
    peer w-full rounded-[16px] border border-m3-outline-variant bg-m3-surface-container-low px-4 text-xs sm:text-sm text-m3-on-surface 
    outline-none placeholder-transparent
    transition-all duration-150 ease-[cubic-bezier(0.2,0,0,1)]
    hover:border-m3-outline
    focus:border-m3-primary focus:ring-1 focus:ring-m3-primary/30
  `;

  const labelClasses = `
    absolute left-3.5 top-[14px] pointer-events-none select-none px-1.5 bg-transparent
    text-xs text-m3-on-surface-variant origin-[0_0]
    will-change-transform
    transition-all duration-150 ease-[cubic-bezier(0.2,0,0,1)]
    
    /* Float label up when input is focused */
    peer-focus:-translate-y-[22px] peer-focus:scale-[0.85] peer-focus:text-m3-primary peer-focus:bg-m3-surface-container-low peer-focus:rounded-sm
    
    /* Float label up when input has content */
    peer-[:not(:placeholder-shown)]:-translate-y-[22px] peer-[:not(:placeholder-shown)]:scale-[0.85] peer-[:not(:placeholder-shown)]:text-m3-on-surface-variant peer-[:not(:placeholder-shown)]:bg-m3-surface-container-low peer-[:not(:placeholder-shown)]:rounded-sm
  `;

  const commonProps = {
    ...(registeredField || {}),
    onChange: (e: any) => {
      registeredField?.onChange(e);
      if (onChange) onChange(e);
    },
    placeholder: placeholder || " ",
    value: value,
  };

  return (
    <div className={`relative flex flex-col w-full ${className}`}>
      {textarea ? (
        <>
          <textarea 
            {...commonProps} 
            rows={rows ?? 3} 
            className={`${baseInputClasses} min-h-[96px] py-3.5 resize-y`} 
          />
          {label && <label className={labelClasses}>{label}</label>}
        </>
      ) : (
        <div className='relative w-full flex items-center'>
          <input
            {...commonProps}
            ref={setRefs}
            type={type}
            min={min}
            max={max}
            className={`${baseInputClasses} h-[46px] ${type === "number" ? "pr-10" : ""}`}
          />

          {type === "number" && (
            <div className='absolute right-2.5 flex flex-col gap-0.5 select-none z-10'>
              <Button
                variant='ghost'
                onClick={handleIncrement}
                className='p-0.5 w-5 h-4.5 rounded hover:bg-white/[0.06] active:bg-white/[0.12] text-text-muted hover:text-white transition-colors cursor-pointer outline-none'
                title='Increment'
              >
                <ChevronUp className='h-3.5 w-3.5' />
              </Button>
              <Button
                variant='ghost'
                onClick={handleDecrement}
                className='p-0.5 w-5 h-4.5 rounded hover:bg-white/[0.06] active:bg-white/[0.12] text-text-muted hover:text-white transition-colors cursor-pointer outline-none'
                title='Decrement'
              >
                <ChevronDown className='h-3.5 w-3.5' />
              </Button>
            </div>
          )}

          {label && <label className={labelClasses}>{label}</label>}
        </div>
      )}
    </div>
  );
}
