import React from "react";
import { Sparkles, Mic, Mail, Zap, Clock, ChevronLeft, Library, Globe } from "lucide-react";
import { cn } from "../../lib/cn";

export type SettingsTab = "textModel" | "transcribeModel" | "email" | "googleSearch" | "personalization" | "schedule" | "library";

interface SidebarItem {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<any>;
}

const sidebarItems: SidebarItem[] = [
  { id: "textModel", label: "Text Generation", icon: Sparkles },
  { id: "transcribeModel", label: "Transcription", icon: Mic },
  { id: "email", label: "Email Integration", icon: Mail },
  { id: "googleSearch", label: "Search Engine", icon: Globe },
  { id: "personalization", label: "Core & Tweaks", icon: Zap },
  { id: "schedule", label: "Schedule Setup", icon: Clock },
  { id: "library", label: "Configuration Library", icon: Library },
];

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onBack: () => void;
}

export function SettingsSidebar({ activeTab, onTabChange, onBack }: SettingsSidebarProps) {
  return (
    <aside className='w-64 border-r border-border-color bg-bg-secondary flex flex-col h-full select-none shrink-0'>
      {/* Sidebar Header */}
      <div className='px-4 py-3.5 border-b border-border-color/20 flex items-center gap-3'>
        <button
          type='button'
          onClick={onBack}
          className='p-2 rounded-full hover:bg-bg-tertiary text-text-muted hover:text-text-main transition-colors duration-200 active:bg-bg-tertiary/80 cursor-pointer'
          title='Back to chat'
        >
          <ChevronLeft className='h-5 w-5' />
        </button>
        <div>
          <h2 className='text-base font-medium tracking-tight text-text-main -mt-0.5'>Control Center</h2>
        </div>
      </div>

      {/* Navigation list */}
      <nav className='flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-none'>
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type='button'
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-full text-left transition-all duration-200 outline-none cursor-pointer group",
                isActive
                  ? "bg-accent-cyan/15 text-accent-cyan font-medium shadow-xs"
                  : "bg-transparent text-text-muted hover:bg-bg-tertiary/60 hover:text-text-main",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-xl transition-colors duration-200 shrink-0",
                  isActive
                    ? "bg-accent-cyan/20 text-accent-cyan"
                    : "bg-bg-tertiary/40 text-text-muted group-hover:bg-bg-tertiary group-hover:text-text-main",
                )}
              >
                <Icon className='h-4 w-4' />
              </div>

              <span className={cn("text-xs tracking-wide truncate", isActive ? "font-bold text-accent-cyan" : "font-medium")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}