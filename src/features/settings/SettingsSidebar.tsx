import React from "react";
import { Sparkles, Mic, Mail, Zap, Clock, ChevronLeft } from "lucide-react";
import { cn } from "../../lib/cn";

export type SettingsTab = "textModel" | "transcribeModel" | "email" | "personalization" | "schedule";

interface SidebarItem {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const sidebarItems: SidebarItem[] = [
  { id: "textModel", label: "Text Generation", icon: Sparkles, description: "LLM providers & APIs" },
  { id: "transcribeModel", label: "Transcription", icon: Mic, description: "Whisper & audio settings" },
  { id: "email", label: "Email Integration", icon: Mail, description: "IMAP credentials & folders" },
  { id: "personalization", label: "Core & Tweaks", icon: Zap, description: "Personalization & features" },
  { id: "schedule", label: "Schedule Setup", icon: Clock, description: "Autonomous cron routines" },
];

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onBack: () => void;
}

export function SettingsSidebar({ activeTab, onTabChange, onBack }: SettingsSidebarProps) {
  return (
    <aside className="w-64 border-r border-border-color bg-bg-secondary flex flex-col h-full select-none shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border-color/30 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-muted hover:text-text-main transition active:scale-95 cursor-pointer"
          title="Back to chat"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-accent-cyan">Preferences</span>
          <h2 className="text-sm font-bold text-text-main -mt-0.5">Control Center</h2>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-none">
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all duration-75 border-l-2 outline-none cursor-pointer",
                isActive
                  ? "bg-bg-tertiary border-accent-cyan text-accent-cyan shadow-sm"
                  : "bg-transparent border-transparent text-text-muted hover:bg-bg-tertiary/40 hover:text-text-main"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-accent-cyan" : "text-text-muted")} />
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{item.label}</p>
                <p className="text-[9px] text-text-muted truncate mt-0.5">{item.description}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Sidebar footer */}
      <div className="p-3 border-t border-border-color/20 text-center select-text">
        <p className="text-[8.5px] font-mono text-text-muted">Version 0.1.0 (Stable)</p>
      </div>
    </aside>
  );
}
