import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { TextField } from "../../components/ui/textField";
import { Switch } from "../../components/ui/switch";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/button";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Palette, Check, ClipboardCheck, FileCode2, Power, Globe } from "lucide-react";
import { cn } from "../../lib/cn";

interface PersonalizationSettingsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

const accentPresets = [
  { name: "Material Teal", value: "#5eead4", bgClass: "bg-[#5eead4]" },
  { name: "Ocean Sky", value: "#38bdf8", bgClass: "bg-[#38bdf8]" },
  { name: "Iris Lavender", value: "#c084fc", bgClass: "bg-[#c084fc]" },
  { name: "Emerald Green", value: "#34d399", bgClass: "bg-[#34d399]" },
  { name: "Amber Gold", value: "#fbbf24", bgClass: "bg-[#fbbf24]" },
  { name: "Coral Rose", value: "#f87171", bgClass: "bg-[#f87171]" },
];

export function PersonalizationSettings({ register, watch, setValue }: PersonalizationSettingsProps) {
  const activeColor = watch("accent_color") || "#5eead4";

  return (
    <div className='space-y-6 animate-fadeIn'>
      {/* Block 1: Persona & Identity */}
      <div className='space-y-3'>
        <SectionHeader>Assistant Persona & Identity</SectionHeader>
        
        <Card className='space-y-4 shadow-sm border border-m3-outline-variant/60'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <TextField 
              name='userName' 
              label='Your Name / Title' 
              placeholder='e.g. Developer' 
              register={register} 
            />
            <TextField 
              name='aiName' 
              label='Assistant Name' 
              placeholder='e.g. Echo' 
              register={register} 
            />
          </div>
          <div className='space-y-1.5'>
            <TextField 
              name='sysPrompt' 
              label='System Instructions & Behavior Persona' 
              placeholder='Define base personality, tone, or specific developer guidelines...'
              register={register} 
              textarea 
              rows={3} 
            />
            <p className='text-[11px] text-m3-on-surface-variant/70 px-1'>
              Define how Echo responds and behaves during conversations.
            </p>
          </div>
        </Card>
      </div>

      {/* Block 2: Material You Accent Palette */}
      <div className='space-y-3'>
        <SectionHeader>Interface Accent Theme</SectionHeader>
        
        <Card className='space-y-4 shadow-sm border border-m3-outline-variant/60'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-xs font-semibold text-m3-on-surface'>Dynamic Accent Color</h4>
              <p className='text-[11px] text-m3-on-surface-variant mt-0.5'>
                Personalize highlights, buttons, and active focus states
              </p>
            </div>

            {/* Active Color Preview Pill */}
            <div className='flex items-center gap-2 px-2.5 py-1 rounded-full bg-m3-surface-container border border-m3-outline-variant/50'>
              <span 
                className='w-3 h-3 rounded-full border border-white/20' 
                style={{ backgroundColor: activeColor }}
              />
              <span className='text-[11px] font-mono text-m3-on-surface uppercase font-medium'>
                {activeColor}
              </span>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-3 pt-1'>
            {accentPresets.map((preset) => {
              const isSelected = activeColor.toLowerCase() === preset.value.toLowerCase();
              return (
                <Button
                  key={preset.value}
                  variant='ghost'
                  size='icon'
                  onClick={() => setValue("accent_color", preset.value, { shouldDirty: true })}
                  className={cn(
                    "w-9 h-9 rounded-full transition-all duration-150 relative cursor-pointer border border-white/10",
                    preset.bgClass,
                    isSelected 
                      ? "ring-2 ring-offset-2 ring-offset-m3-surface ring-white scale-110 shadow-md" 
                      : "hover:scale-105 opacity-85 hover:opacity-100"
                  )}
                  title={preset.name}
                >
                  {isSelected && <Check className='w-4 h-4 text-black/80 stroke-[3]' />}
                </Button>
              );
            })}

            {/* Custom Color Input */}
            <div className='flex items-center gap-2 pl-2 border-l border-m3-outline-variant/60'>
              <label 
                htmlFor='accent_color_picker' 
                className='relative w-9 h-9 rounded-full border-2 border-dashed border-m3-outline hover:border-m3-primary flex items-center justify-center cursor-pointer transition-colors group'
                title="Custom color hex"
              >
                <Palette className='w-4 h-4 text-m3-on-surface-variant group-hover:text-m3-primary transition-colors' />
                <input
                  type='color'
                  id='accent_color_picker'
                  {...register("accent_color")}
                  className='absolute inset-0 opacity-0 w-full h-full cursor-pointer'
                />
              </label>
              <span className='text-[11px] text-m3-on-surface-variant hidden sm:inline'>
                Custom Hex
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Block 3: Productivity & Background Integrations */}
      <div className='space-y-3'>
        <SectionHeader>Productivity & Background Services</SectionHeader>
        
        <Card className='divide-y divide-m3-outline-variant/40 p-0 overflow-hidden shadow-sm border border-m3-outline-variant/60'>
          <div className='p-3.5 sm:p-4'>
            <div className='flex items-start gap-3'>
              <div className='p-2 rounded-full bg-m3-surface-container text-m3-primary shrink-0 mt-0.5'>
                <ClipboardCheck className='w-4 h-4' />
              </div>
              <div className='flex-1'>
                <Switch
                  variant='row'
                  name='enable_clipboard_helper'
                  label='Smart Clipboard Watcher'
                  description='Automatically parses and analyzes code error stack traces copied to your clipboard'
                  register={register}
                  className='p-0 hover:bg-transparent'
                />
              </div>
            </div>
          </div>

          <div className='p-3.5 sm:p-4'>
            <div className='flex items-start gap-3'>
              <div className='p-2 rounded-full bg-m3-surface-container text-m3-primary shrink-0 mt-0.5'>
                <FileCode2 className='w-4 h-4' />
              </div>
              <div className='flex-1'>
                <Switch
                  variant='row'
                  name='enable_file_watcher'
                  label='Background File Watcher'
                  description='Monitors modified files and runs automated compilation checks in the background'
                  register={register}
                  className='p-0 hover:bg-transparent'
                />
              </div>
            </div>
          </div>

          <div className='p-3.5 sm:p-4'>
            <div className='flex items-start gap-3'>
              <div className='p-2 rounded-full bg-m3-surface-container text-m3-primary shrink-0 mt-0.5'>
                <Power className='w-4 h-4' />
              </div>
              <div className='flex-1'>
                <Switch
                  variant='row'
                  name='enable_autostart'
                  label='Launch on Startup'
                  description='Launches Echo AI automatically in the background when your system boots'
                  register={register}
                  className='p-0 hover:bg-transparent'
                />
              </div>
            </div>
          </div>

          <div className='p-3.5 sm:p-4 space-y-2 bg-m3-surface-container/20'>
            <div className='flex items-center gap-2'>
              <Globe className='w-3.5 h-3.5 text-m3-on-surface-variant' />
              <label className='text-xs font-medium text-m3-on-surface'>
                Browser Automation Profile Directory
              </label>
            </div>
            <TextField
              name='browser_profile_path'
              placeholder='~/.echo-ai/browser-profile'
              register={register}
            />
            <p className='text-[11px] text-m3-on-surface-variant/70 px-1'>
              Directory used for saving browser sessions and cookies during autonomous automation.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
