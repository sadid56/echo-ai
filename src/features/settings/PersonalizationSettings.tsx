import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { TextField } from "../../components/ui/textField";
import { Switch } from "../../components/ui/switch";
import { Dropdown } from "../../components/ui/dropdown";
import { Card } from "../../components/ui/Card";
import { SectionHeader } from "../../components/ui/SectionHeader";

interface PersonalizationSettingsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

const accentColorOptions = [
  { label: "Default Cyan", value: "#00f0ff" },
  { label: "Royal Blue", value: "#3b82f6" },
  { label: "GNOME Purple", value: "#c77dff" },
  { label: "Forest Green", value: "#10b981" },
  { label: "Sunset Orange", value: "#f59e0b" },
  { label: "GNOME Red", value: "#ef4444" },
];

export function PersonalizationSettings({ register, watch, setValue }: PersonalizationSettingsProps) {
  return (
    <div className='space-y-6 animate-fadeIn'>
      {/* Block 1: Identity & Persona */}
      <div className='space-y-4'>
        <SectionHeader>Personalization & Core Assistant Options</SectionHeader>
        
        <div className='space-y-6'>
          <div className='grid gap-6 sm:grid-cols-2'>
            <TextField name='userName' label='User Name' register={register} />
            <TextField name='aiName' label='Assistant Name' register={register} />
          </div>
          <TextField name='sysPrompt' label='Global System Prompt' register={register} textarea rows={4} />
        </div>
      </div>

      {/* Block 2: Integrations */}
      <div className='space-y-4'>
        <SectionHeader>Productivity Integrations</SectionHeader>
        
        <div className='space-y-6'>
          <TextField
            name='browser_profile_path'
            label='Browser Automation Profile Path'
            placeholder='e.g., ~/.echo-ai/browser-profile'
            register={register}
          />

          <div className='flex flex-col gap-4 mt-2'>
            <Switch
              name='enable_clipboard_helper'
              label='Enable Smart Clipboard Watcher (Instantly resolves copied stack traces/errors)'
              register={register}
            />

            <Switch
              name='enable_file_watcher'
              label='Enable Background File Watcher & Automated Compilation Build Tester'
              register={register}
            />

            <Switch
              name='enable_autostart'
              label='Enable Auto-Start on System Boot (Launches Echo AI automatically on startup)'
              register={register}
            />
          </div>
        </div>
      </div>

      {/* Block 3: Accent Styling Presets */}
      <div className='space-y-4'>
        <SectionHeader>Custom UI Accent Theme (GTK Accent Theme)</SectionHeader>
        
        <Card className='grid gap-6 sm:grid-cols-2 mt-2 space-y-0'>
          <div className='space-y-2'>
            <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted select-none'>
              Accent Theme Preset
            </label>
            <Dropdown
              value={watch("accent_color") || "#00f0ff"}
              onChange={(nextValue) => setValue("accent_color", nextValue, { shouldDirty: true })}
              options={accentColorOptions}
            />
          </div>
          <div className='space-y-2 flex flex-col justify-end'>
            <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted select-none'>
              Custom Accent Color Picker
            </label>
            <div className='flex gap-3.5 items-center h-[42px]'>
              <input
                type='color'
                id='accent_color_picker'
                {...register("accent_color")}
                className='h-10 w-16 rounded-xl border border-border-color bg-bg-primary cursor-pointer'
              />
              <span className='text-xs font-mono text-text-muted uppercase select-all'>{watch("accent_color")}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
