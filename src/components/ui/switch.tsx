import { UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import React from "react";
import { cn } from "../../lib/cn";
import { motion } from "motion/react";

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

  const handleToggle = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
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
      onClick={handleToggle}
      className={cn(
        "flex items-center justify-between bg-bg-secondary/60 p-4.5 rounded-2xl border border-border-color/30 transition-all duration-200 select-none cursor-pointer hover:border-border-color/60",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
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
        type="checkbox"
        checked={checked}
        onChange={handleInputChange}
        disabled={disabled}
        className="sr-only"
      />

      {label && (
        <label
          className={cn(
            "text-xs font-semibold text-text-main cursor-pointer select-none flex-1 leading-tight pr-4",
            disabled && "cursor-not-allowed text-text-muted"
          )}
        >
          {label}
        </label>
      )}

      {/* Material 3 Switch Track */}
      <div
        className={cn(
          "relative inline-flex h-7 w-13 shrink-0 rounded-full border-2 transition-colors duration-200 ease-in-out outline-none items-center",
          isChecked 
            ? "bg-accent-cyan border-accent-cyan" 
            : "bg-bg-primary border-border-color"
        )}
      >
        {/* Toggle knob */}
        <motion.span
          layout
          animate={{
            x: isChecked ? 24 : 2,
            width: isChecked ? 20 : 16,
            height: isChecked ? 20 : 16,
            backgroundColor: isChecked ? "#0a0a0c" : "var(--color-text-muted)",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          className="pointer-events-none inline-block rounded-full shadow-md"
        />
      </div>
    </div>
  );
}
