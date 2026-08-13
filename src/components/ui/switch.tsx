import { UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import React from "react";
import { cn } from "../../lib/cn";

interface SwitchProps<TFieldValues extends Record<string, unknown> = Record<string, any>> {
  name?: keyof TFieldValues & string;
  label?: string;
  register?: UseFormRegister<TFieldValues>;
  className?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch<TFieldValues extends Record<string, unknown> = Record<string, any>>({
  name,
  label,
  register,
  className = "",
  checked,
  onChange,
  disabled = false,
}: SwitchProps<TFieldValues>) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const fieldProps = register && name ? register(name as any) : ({} as Partial<UseFormRegisterReturn>);

  const [localChecked, setLocalChecked] = React.useState(false);

  const isChecked = checked !== undefined ? checked : localChecked;

  const handleToggle = () => {
    if (disabled) return;
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalChecked(e.target.checked);
    if (fieldProps.onChange) {
      fieldProps.onChange(e);
    }
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  React.useEffect(() => {
    if (inputRef.current) {
      setLocalChecked(inputRef.current.checked);
    }
  }, [inputRef.current?.checked]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 bg-bg-secondary/40 p-3.5 rounded-xl border border-border-color/30 transition-all duration-150 select-none",
        className,
      )}
    >
      <input
        {...fieldProps}
        ref={(el) => {
          inputRef.current = el;
          if (fieldProps.ref) {
            fieldProps.ref(el);
          }
        }}
        type='checkbox'
        checked={checked}
        onChange={handleInputChange}
        disabled={disabled}
        className='sr-only'
      />

      <div
        onClick={handleToggle}
        className={cn(
          "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border border-border-color bg-bg-primary transition-colors duration-200 ease-in-out outline-none focus-within:ring-2 focus-within:ring-accent-cyan/30",
          disabled && "opacity-50 cursor-not-allowed",
          isChecked ? "bg-accent-cyan border-accent-cyan/40" : "bg-bg-primary",
        )}
      >
        {/* Toggle knob */}
        <span
          className={cn(
            "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-text-muted transition duration-200 ease-in-out shadow-md mt-0.5",
            isChecked ? "translate-x-[18px] bg-bg-primary" : "translate-x-0.5 bg-text-muted",
          )}
        />
      </div>

      {label && (
        <label
          onClick={handleToggle}
          className={cn(
            "text-xs font-semibold text-text-main cursor-pointer select-none flex-1 leading-tight",
            disabled && "cursor-not-allowed text-text-muted",
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
