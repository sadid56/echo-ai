import React from "react";

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeader({ children, className = "" }: SectionHeaderProps) {
  return (
    <h3 className={`text-xs sm:text-sm font-medium tracking-normal text-m3-primary select-none flex items-center gap-2 ${className}`}>
      <span className='w-1 h-3.5 rounded-full bg-m3-primary shrink-0 inline-block' />
      <span>{children}</span>
    </h3>
  );
}
