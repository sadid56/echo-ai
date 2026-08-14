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
  primary: 
    "bg-accent-cyan text-[#08080a] hover:bg-accent-cyan/90 hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] focus:ring-2 focus:ring-accent-cyan/20 border border-accent-cyan/10",
  secondary:
    "border border-white/10 bg-white/[0.04] text-text-main hover:bg-white/[0.08] active:bg-white/[0.12] focus:ring-2 focus:ring-white/10",
  ghost: 
    "bg-transparent text-text-muted hover:bg-white/[0.04] hover:text-text-main active:bg-white/[0.08]",
  error: 
    "bg-red-500 text-white hover:bg-red-400 active:bg-red-600 border border-red-500/10 focus:ring-2 focus:ring-red-500/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[10.5px] rounded-xl",
  md: "px-5 py-2.5 text-xs rounded-xl",
  lg: "px-6 py-3.5 text-xs rounded-xl",
};

export function Button({ variant = "primary", size = "md", fullWidth = false, className = "", type = "button", ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center font-semibold tracking-wider transition-all duration-200 ease-out select-none disabled:cursor-not-allowed disabled:opacity-40 outline-none cursor-pointer",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );

  return <button type={type} className={classes} {...props} />;
}
