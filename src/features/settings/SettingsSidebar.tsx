import React from "react";
import { Sparkles, Mic, Mail, Zap, Clock, Library, Globe, Send, User } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../../components/ui/button";

export type SettingsTab = "textModel" | "transcribeModel" | "email" | "googleSearch" | "personalization" | "schedule" | "library" | "telegram" | "telegramUser";

export interface SidebarItem {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<any>;
}

export const sidebarItems: SidebarItem[] = [
  { id: "textModel", label: "Text Generation", icon: Sparkles },
  { id: "transcribeModel", label: "Transcription", icon: Mic },
  { id: "email", label: "Email Integration", icon: Mail },
  { id: "googleSearch", label: "Search Engine", icon: Globe },
  { id: "telegram", label: "Telegram Bot", icon: Send },
  { id: "telegramUser", label: "Telegram Chat", icon: User },
  { id: "personalization", label: "Core & Tweaks", icon: Zap },
  { id: "schedule", label: "Schedule Setup", icon: Clock },
  { id: "library", label: "Configuration Library", icon: Library },
];

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onBack?: () => void;
}

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <aside className='hidden md:flex w-56 lg:w-60 border-r border-m3-outline-variant bg-m3-surface-container-low flex-col h-full select-none shrink-0'>
      {/* Navigation list */}
      <nav className='flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-none'>
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <Button
              key={item.id}
              variant='ghost'
              isActive={isActive}
              fullWidth
              onClick={() => onTabChange(item.id)}
              className='justify-start gap-3 px-3.5 py-2.5 h-10 rounded-full text-left font-normal'
            >
              <Icon className={cn("h-4 w-4 shrink-0")} />
              <span className='text-xs truncate'>{item.label}</span>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}