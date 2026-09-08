import React from "react";
import { cn } from "../../lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-m3-surface-container-low p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-m3-outline-variant space-y-5 transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
