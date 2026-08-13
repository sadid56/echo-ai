import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "error";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent-cyan text-bg-primary hover:bg-accent-cyan/90 active:bg-accent-cyan/85 shadow-sm border border-accent-cyan/20",
  secondary:
    "border border-border-color/70 bg-bg-tertiary/80 text-text-main hover:bg-bg-secondary hover:border-border-color active:bg-bg-tertiary shadow-sm",
  ghost: "bg-transparent text-text-muted hover:bg-bg-tertiary/75 hover:text-text-main active:bg-bg-tertiary",
  error: "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 shadow-sm border border-red-700/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-[10.5px] rounded",
  md: "px-3.5 py-2 text-xs rounded-md",
  lg: "px-4.5 py-2.5 text-xs rounded-md",
};

export function Button({ variant = "primary", size = "md", fullWidth = false, className = "", type = "button", ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-between font-bold uppercase tracking-wider transition-all duration-75 select-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );

  return <button type={type} className={classes} {...props} />;
}
