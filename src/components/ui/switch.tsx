import { UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import React from "react";
import { cn } from "../../lib/cn";
import { motion } from "motion/react";

interface SwitchProps<TFieldValues extends Record<string, unknown> = Record<string, any>> {
  name?: keyof TFieldValues & string;
  label?: string;
  description?: string;
  register?: UseFormRegister<TFieldValues>;
  className?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  variant?: "card" | "row";
}

export function Switch<TFieldValues extends Record<string, unknown> = Record<string, any>>({
  name,
  label,
  description,
  register,
  className = "",
  checked,
  onChange,
  disabled = false,
  variant = "card",
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
        variant === "card"
          ? "flex items-center justify-between bg-m3-surface-container-low p-4 sm:p-4.5 rounded-[20px] border border-m3-outline-variant transition-all duration-200 select-none cursor-pointer hover:border-m3-outline"
          : "flex items-center justify-between p-3 sm:p-3.5 transition-all duration-150 select-none cursor-pointer hover:bg-white/[0.02] rounded-xl",
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

      <div className="flex-1 pr-4">
        {label && (
          <label
            className={cn(
              "text-xs sm:text-sm font-medium text-m3-on-surface cursor-pointer select-none block leading-snug",
              disabled && "cursor-not-allowed text-m3-on-surface-variant"
            )}
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-[11px] text-m3-on-surface-variant mt-0.5 leading-normal select-none">
            {description}
          </p>
        )}
      </div>

      {/* Material 3 Switch Track */}
      <div
        className={cn(
          "relative inline-flex h-8 w-13 shrink-0 rounded-full border-2 transition-colors duration-200 ease-in-out outline-none items-center p-0.5",
          isChecked 
            ? "bg-m3-primary border-m3-primary" 
            : "bg-m3-surface-container-highest border-m3-outline"
        )}
      >
        {/* Toggle knob */}
        <motion.span
          layout
          animate={{
            x: isChecked ? 20 : 2,
            width: isChecked ? 22 : 16,
            height: isChecked ? 22 : 16,
            backgroundColor: isChecked ? "#003731" : "rgba(255, 255, 255, 0.5)",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          className="pointer-events-none inline-block rounded-full shadow-xs"
        />
      </div>
    </div>
  );
}
