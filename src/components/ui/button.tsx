import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "error";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 
    "bg-m3-primary text-m3-on-primary font-medium hover:brightness-105 active:scale-[0.98] transition-all shadow-xs",
  secondary:
    "bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant active:scale-[0.98] transition-all",
  ghost: 
    "bg-transparent text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-white/[0.05] active:scale-[0.98] transition-all",
  error: 
    "bg-rose-500/15 text-rose-300 border border-rose-500/25 hover:bg-rose-500/25 active:scale-[0.98] transition-all",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-xs rounded-full gap-1.5",
  md: "px-4.5 py-2 text-xs font-medium rounded-full gap-2",
  lg: "px-6 py-2.5 text-sm font-medium rounded-full gap-2.5",
  icon: "w-8 h-8 p-0 rounded-full flex items-center justify-center",
};

export function Button({ variant = "primary", size = "md", fullWidth = false, className = "", type = "button", ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center font-medium tracking-normal transition-all duration-150 ease-out select-none disabled:cursor-not-allowed disabled:opacity-40 outline-none cursor-pointer",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );

  return <button type={type} className={classes} {...props} />;
}
