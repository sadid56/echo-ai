import React from "react";
import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { TextField } from "../../components/ui/textField";
import { Switch } from "../../components/ui/switch";
import { Dropdown } from "../../components/ui/dropdown";

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
    <div className='space-y-4 animate-fadeIn'>
      <div className='space-y-3.5'>
        <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
          Personalization & Core Assistant Options
        </h3>
        <div className='grid gap-4 sm:grid-cols-2'>
          <TextField name='userName' label='User Name' register={register} />
          <TextField name='aiName' label='Assistant Name' register={register} />
        </div>
        <TextField name='sysPrompt' label='Global System Prompt' register={register} textarea rows={4} />

        <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan pt-4'>
          Productivity Integrations
        </h3>
        <TextField
          name='browser_profile_path'
          label='Browser Automation Profile Path'
          placeholder='e.g., ~/.echo-ai/browser-profile'
          register={register}
        />

        <div className='flex flex-col gap-3 mt-2'>
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

          <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan pt-4'>
            Custom UI Accent Theme (GTK Accent Theme)
          </h3>
          <div className='grid gap-4 sm:grid-cols-2 bg-bg-secondary/40 p-4 rounded-xl border border-border-color/30 mt-2'>
            <div className='space-y-1.5'>
              <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted select-none'>
                Accent Theme Preset
              </label>
              <Dropdown
                value={watch("accent_color") || "#00f0ff"}
                onChange={(nextValue) => setValue("accent_color", nextValue, { shouldDirty: true })}
                options={accentColorOptions}
              />
            </div>
            <div className='space-y-1.5 flex flex-col justify-end'>
              <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted select-none'>
                Custom Accent Color Picker
              </label>
              <div className='flex gap-3 items-center'>
                <input
                  type='color'
                  id='accent_color_picker'
                  {...register("accent_color")}
                  className='h-9 w-14 rounded border border-border-color bg-bg-primary cursor-pointer'
                />
                <span className='text-xs font-mono text-text-muted uppercase select-all'>{watch("accent_color")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
