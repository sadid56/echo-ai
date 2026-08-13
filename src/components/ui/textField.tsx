import { UseFormRegister } from "react-hook-form";
import React from "react";

interface TextFieldProps<TFieldValues extends Record<string, unknown> = Record<string, any>> {
  name?: keyof TFieldValues & string;
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

export function TextField<TFieldValues extends Record<string, unknown> = Record<string, any>>({
  name,
  label,
  type = "text",
  placeholder,
  register,
  className = "",
  rows,
  textarea = false,
  value,
  onChange,
  min,
  max,
}: TextFieldProps<TFieldValues>) {
  const baseClassName = `w-full rounded-md border border-border-color bg-bg-primary px-3 py-2 text-xs text-text-main placeholder-text-muted outline-none transition-all duration-75 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20 focus:bg-bg-primary/90 shadow-inner ${className}`;

  const fieldProps = register && name ? register(name as any) : { value, onChange };

  if (textarea) {
    return (
      <div className='flex flex-col gap-1'>
        {label && <label className='text-[9.5px] font-bold uppercase tracking-wider text-text-muted select-none'>{label}</label>}
        <textarea {...fieldProps} rows={rows ?? 4} placeholder={placeholder} className={`${baseClassName} resize-none`} />
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-1'>
      {label && <label className='text-[9.5px] font-bold uppercase tracking-wider text-text-muted select-none'>{label}</label>}
      <input {...fieldProps} type={type} placeholder={placeholder} min={min} max={max} className={baseClassName} />
    </div>
  );
}
