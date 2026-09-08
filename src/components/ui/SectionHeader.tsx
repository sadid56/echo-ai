import React from "react";

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeader({ children, className = "" }: SectionHeaderProps) {
  return (
    <h3 className={`text-xs sm:text-sm font-medium tracking-normal text-m3-on-surface select-none flex items-center gap-2 ${className}`}>
      <span>{children}</span>
    </h3>
  );
}
