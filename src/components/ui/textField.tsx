import { UseFormRegister } from "react-hook-form";

interface TextFieldProps<TFieldValues extends Record<string, unknown>> {
  name: keyof TFieldValues & string;
  label?: string;
  type?: "text" | "password" | "email";
  placeholder?: string;
  register: UseFormRegister<TFieldValues>;
  className?: string;
  rows?: number;
  textarea?: boolean;
}

export function TextField<TFieldValues extends Record<string, unknown>>({
  name,
  label,
  type = "text",
  placeholder,
  register,
  className = "",
  rows,
  textarea = false,
}: TextFieldProps<TFieldValues>) {
  const baseClassName = `w-full rounded-lg border border-border-color bg-bg-tertiary px-3 py-2.5 text-sm text-text-main outline-none transition focus:border-accent-cyan/60 ${className}`;

  const fieldProps = register(name as any);

  if (textarea) {
    return (
      <div className='flex flex-col gap-1.5'>
        {label && <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted'>{label}</label>}
        <textarea {...fieldProps} rows={rows ?? 4} placeholder={placeholder} className={`${baseClassName} resize-none`} />
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-1.5'>
      {label && <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted'>{label}</label>}
      <input {...fieldProps} type={type} placeholder={placeholder} className={baseClassName} />
    </div>
  );
}
