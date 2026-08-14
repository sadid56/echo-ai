import React from "react";
import { cn } from "../../lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-bg-secondary/60 p-5 rounded-2xl border border-border-color/30 space-y-6 transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
