import React, { useRef } from "react";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";
import { ChevronUp, ChevronDown } from "lucide-react";

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
    peer w-full h-[42px] rounded-lg border border-border-color bg-white/[0.04] px-3.5 text-xs text-text-main 
    outline-none placeholder-transparent
    transition-all duration-150 ease-[cubic-bezier(0.2,0,0,1)]
    hover:border-text-muted/50
    focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/30
  `;

  const labelClasses = `
    absolute left-3.5 top-[13px] pointer-events-none select-none px-1 bg-transparent
    text-xs text-text-muted/60 origin-[0_0]
    will-change-transform
    transition-all duration-150 ease-[cubic-bezier(0.2,0,0,1)]
    
    /* Float label up when input is focused */
    peer-focus:-translate-y-[21px] peer-focus:scale-[0.82] peer-focus:text-accent-cyan peer-focus:bg-bg-primary
    
    /* Float label up when input has content */
    peer-[:not(:placeholder-shown)]:-translate-y-[21px] peer-[:not(:placeholder-shown)]:scale-[0.82] peer-[:not(:placeholder-shown)]:text-text-muted peer-[:not(:placeholder-shown)]:bg-bg-primary
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
          <textarea {...commonProps} rows={rows ?? 4} className={`${baseInputClasses} resize-none`} />
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
            className={`${baseInputClasses} ${type === "number" ? "pr-10" : ""}`}
          />

          {type === "number" && (
            <div className='absolute right-2.5 flex flex-col gap-0.5 select-none z-10'>
              <button
                type='button'
                onClick={handleIncrement}
                className='p-0.5 rounded hover:bg-white/[0.06] active:bg-white/[0.12] text-text-muted hover:text-white transition-colors cursor-pointer outline-none'
                title='Increment'
              >
                <ChevronUp className='h-3.5 w-3.5' />
              </button>
              <button
                type='button'
                onClick={handleDecrement}
                className='p-0.5 rounded hover:bg-white/[0.06] active:bg-white/[0.12] text-text-muted hover:text-white transition-colors cursor-pointer outline-none'
                title='Decrement'
              >
                <ChevronDown className='h-3.5 w-3.5' />
              </button>
            </div>
          )}

          {label && <label className={labelClasses}>{label}</label>}
        </div>
      )}
    </div>
  );
}
