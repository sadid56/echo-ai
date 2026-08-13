import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Dropdown } from "../components/ui/dropdown";
import { TextField } from "../components/ui/textField";
import { Switch } from "../components/ui/switch";
import { AppConfig, useChatStore, ScheduledTask } from "../store/chatStore";
import { SettingsSidebar, SettingsTab } from "../features/settings/SettingsSidebar";
import { textPresetOptions, transcribePresetOptions, textModelPresets, transcribeModelPresets } from "../config/model";

type SettingsFormValues = {
  text_provider_name: string;
  text_api_endpoint: string;
  text_api_key: string;
  text_model_name: string;

  transcribe_provider_name: string;
  transcribe_api_endpoint: string;
  transcribe_api_key: string;
  transcribe_model_name: string;

  sysPrompt: string;
  aiName: string;
  userName: string;
  imapServer: string;
  emailAddress: string;
  appPassword: string;

  browser_profile_path: string;
  enable_clipboard_helper: boolean;
  enable_file_watcher: boolean;
  enable_autostart: boolean;
  accent_color: string;
};

const buildDefaultValues = (config: AppConfig | null): SettingsFormValues => ({
  text_provider_name: config?.text_model?.provider_name ?? "OpenAI",
  text_api_endpoint: config?.text_model?.api_endpoint ?? "https://api.openai.com/v1/chat/completions",
  text_api_key: config?.text_model?.api_key ?? "",
  text_model_name: config?.text_model?.model_name ?? "gpt-4o",

  transcribe_provider_name: config?.transcribe_model?.provider_name ?? "OpenAI",
  transcribe_api_endpoint: config?.transcribe_model?.api_endpoint ?? "https://api.openai.com/v1/audio/transcriptions",
  transcribe_api_key: config?.transcribe_model?.api_key ?? "",
  transcribe_model_name: config?.transcribe_model?.model_name ?? "whisper-1",

  sysPrompt: config?.system_prompt ?? "",
  aiName: config?.ai_name ?? "Echo",
  userName: config?.user_name ?? "Developer",
  imapServer: config?.email.imap_server ?? "imap.gmail.com",
  emailAddress: config?.email.email_address ?? "",
  appPassword: config?.email.app_password ?? "",

  browser_profile_path: config?.browser_profile_path ?? "~/.echo-ai/browser-profile",
  enable_clipboard_helper: config?.enable_clipboard_helper ?? false,
  enable_file_watcher: config?.enable_file_watcher ?? false,
  enable_autostart: config?.enable_autostart ?? false,
  accent_color: config?.accent_color ?? "#00f0ff",
});

const accentColorOptions = [
  { label: "Default Cyan", value: "#00f0ff" },
  { label: "Royal Blue", value: "#3b82f6" },
  { label: "GNOME Purple", value: "#c77dff" },
  { label: "Forest Green", value: "#10b981" },
  { label: "Sunset Orange", value: "#f59e0b" },
  { label: "GNOME Red", value: "#ef4444" },
];

const frequencyOptions = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Interval (Minutes)", value: "interval" },
];

export function SettingsScreen() {
  const { config, updateConfig } = useChatStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("textModel");
  const [scheduleList, setScheduleList] = useState<ScheduledTask[]>([]);

  const { register, handleSubmit, reset, setValue, watch } = useForm<SettingsFormValues>({
    defaultValues: buildDefaultValues(config),
  });

  useEffect(() => {
    if (config) {
      reset(buildDefaultValues(config));
      setScheduleList(config.schedule ?? []);
    }
  }, [config, reset]);

  // Form states for adding a new scheduled task
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskFrequency, setNewTaskFrequency] = useState("daily");
  const [newTaskDayOfMonth, setNewTaskDayOfMonth] = useState(1);
  const [newTaskDayOfWeek, setNewTaskDayOfWeek] = useState(1);
  const [newTaskHour, setNewTaskHour] = useState(9);
  const [newTaskMinute, setNewTaskMinute] = useState(0);
  const [newTaskIntervalMinutes, setNewTaskIntervalMinutes] = useState(2);
  const [newTaskPrompt, setNewTaskPrompt] = useState("");

  const handleAddTask = () => {
    if (!newTaskName.trim() || !newTaskPrompt.trim()) return;

    const newTask: ScheduledTask = {
      name: newTaskName.trim(),
      frequency: newTaskFrequency,
      day_of_month: newTaskFrequency === "monthly" ? Number(newTaskDayOfMonth) : null,
      day_of_week: newTaskFrequency === "weekly" ? Number(newTaskDayOfWeek) : null,
      hour: newTaskFrequency !== "interval" ? Number(newTaskHour) : null,
      minute: newTaskFrequency !== "interval" ? Number(newTaskMinute) : null,
      interval_minutes: newTaskFrequency === "interval" ? Number(newTaskIntervalMinutes) : null,
      prompt: newTaskPrompt.trim(),
    };

    setScheduleList((prev) => [...prev, newTask]);

    setNewTaskName("");
    setNewTaskFrequency("daily");
    setNewTaskDayOfMonth(1);
    setNewTaskDayOfWeek(1);
    setNewTaskHour(9);
    setNewTaskMinute(0);
    setNewTaskIntervalMinutes(2);
    setNewTaskPrompt("");
  };

  const handleRemoveTask = (index: number) => {
    setScheduleList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTextPresetSelect = (presetLabel: string) => {
    const preset = textModelPresets.find((p) => p.label === presetLabel);
    if (preset) {
      setValue("text_provider_name", preset.providerName, { shouldDirty: true });
      setValue("text_api_endpoint", preset.apiEndpoint, { shouldDirty: true });
      setValue("text_model_name", preset.modelName, { shouldDirty: true });
    }
  };

  const handleTranscribePresetSelect = (presetLabel: string) => {
    const preset = transcribeModelPresets.find((p) => p.label === presetLabel);
    if (preset) {
      setValue("transcribe_provider_name", preset.providerName, { shouldDirty: true });
      setValue("transcribe_api_endpoint", preset.apiEndpoint, { shouldDirty: true });
      setValue("transcribe_model_name", preset.modelName, { shouldDirty: true });
    }
  };

  const formatTaskScheduleLabel = (task: ScheduledTask) => {
    switch (task.frequency) {
      case "daily":
        return `Daily at ${String(task.hour).padStart(2, "0")}:${String(task.minute).padStart(2, "0")}`;
      case "weekly":
        const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const dayLabel = dayNames[(task.day_of_week ?? 1) - 1] ?? "Monday";
        return `Weekly on ${dayLabel} at ${String(task.hour).padStart(2, "0")}:${String(task.minute).padStart(2, "0")}`;
      case "monthly":
        return `Monthly on the ${task.day_of_month}th day at ${String(task.hour).padStart(2, "0")}:${String(task.minute).padStart(2, "0")}`;
      case "interval":
        return `Repeat every ${task.interval_minutes} minutes`;
      default:
        return "Task Schedule";
    }
  };

  const onSubmit = async (values: SettingsFormValues) => {
    const nextConfig: AppConfig = {
      text_model: {
        provider_name: values.text_provider_name,
        api_endpoint: values.text_api_endpoint,
        api_key: values.text_api_key,
        model_name: values.text_model_name,
      },
      transcribe_model: {
        provider_name: values.transcribe_provider_name,
        api_endpoint: values.transcribe_api_endpoint,
        api_key: values.transcribe_api_key,
        model_name: values.transcribe_model_name,
      },
      system_prompt: values.sysPrompt,
      ai_name: values.aiName,
      user_name: values.userName,
      email: {
        imap_server: values.imapServer,
        email_address: values.emailAddress,
        app_password: values.appPassword,
      },
      browser_profile_path: values.browser_profile_path,
      enable_clipboard_helper: values.enable_clipboard_helper,
      enable_file_watcher: values.enable_file_watcher,
      enable_autostart: values.enable_autostart,
      accent_color: values.accent_color,
      schedule: scheduleList,
    };

    await updateConfig(nextConfig);
    navigate("/");
  };

  return (
    <div className='flex w-screen h-screen bg-bg-primary text-text-main overflow-hidden'>
      {/* Settings Navigation Sidebar */}
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} onBack={() => navigate("/")} />

      {/* Main Settings Form Panel */}
      <div className='flex-1 h-full flex flex-col bg-bg-primary overflow-hidden'>
        {/* Header */}
        <header className='px-8 py-4.5 border-b border-border-color/30 flex items-center justify-between select-none bg-bg-secondary/20'>
          <div>
            <h1 className='text-sm font-bold text-text-main uppercase tracking-wider'>
              {activeTab === "textModel" && "Text Generation Model"}
              {activeTab === "transcribeModel" && "Audio Transcription Model"}
              {activeTab === "email" && "Email Agent Configuration"}
              {activeTab === "personalization" && "Productivity & Personalization"}
              {activeTab === "schedule" && "Scheduled Tasks & Cron Setup"}
            </h1>
            <p className='text-[10px] text-text-muted mt-0.5'>
              {activeTab === "textModel" && "Configure model presets, endpoints, and credentials for language tasks."}
              {activeTab === "transcribeModel" && "Configure audio processing, voice to text, and transcription endpoints."}
              {activeTab === "email" && "Set up secure IMAP connections to automate unread email indexing."}
              {activeTab === "personalization" && "Customize accent colors, autostart rules, file watchers, and prompts."}
              {activeTab === "schedule" && "Manage automated routines, time triggers, and recurrent prompt execution."}
            </p>
          </div>

          <Button variant='secondary' size='sm' onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </header>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className='flex-1 flex flex-col min-h-0 overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-8 space-y-6 max-w-2xl min-h-0 select-text'>
            {activeTab === "textModel" && (
              <div className='space-y-4 animate-fadeIn'>
                <div className='space-y-3.5'>
                  <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
                    Text Generation Model Setup
                  </h3>
                  <div className='space-y-1.5'>
                    <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted'>Load from Preset</label>
                    <Dropdown value='' onChange={(nextValue) => handleTextPresetSelect(nextValue)} options={textPresetOptions} />
                  </div>
                  <TextField
                    name='text_provider_name'
                    label='Provider Name'
                    placeholder='e.g., OpenAI, Gemini, Ollama'
                    register={register}
                  />
                  <TextField
                    name='text_api_endpoint'
                    label='API Endpoint URL'
                    placeholder='e.g., https://api.openai.com/v1/chat/completions'
                    register={register}
                  />
                  <TextField
                    name='text_api_key'
                    label='API Key'
                    type='password'
                    placeholder='Enter your API token (leave empty if local/Ollama)'
                    register={register}
                  />
                  <TextField
                    name='text_model_name'
                    label='Model Name (ID)'
                    placeholder='e.g., gpt-4o, gemini-1.5-flash, minimax-m3:cloud'
                    register={register}
                  />
                </div>
              </div>
            )}

            {activeTab === "transcribeModel" && (
              <div className='space-y-4 animate-fadeIn'>
                <div className='space-y-3.5'>
                  <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
                    Audio Transcription Model Setup
                  </h3>
                  <div className='space-y-1.5'>
                    <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted'>Load from Preset</label>
                    <Dropdown
                      value=''
                      onChange={(nextValue) => handleTranscribePresetSelect(nextValue)}
                      options={transcribePresetOptions}
                    />
                  </div>
                  <TextField name='transcribe_provider_name' label='Provider Name' placeholder='e.g., OpenAI, Gemini' register={register} />
                  <TextField
                    name='transcribe_api_endpoint'
                    label='API Endpoint URL'
                    placeholder='e.g., https://api.openai.com/v1/audio/transcriptions'
                    register={register}
                  />
                  <TextField
                    name='transcribe_api_key'
                    label='API Key'
                    type='password'
                    placeholder='Enter your API token'
                    register={register}
                  />
                  <TextField
                    name='transcribe_model_name'
                    label='Model Name (ID)'
                    placeholder='e.g., whisper-1, gemini-1.5-flash'
                    register={register}
                  />
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className='space-y-4 animate-fadeIn'>
                <div className='space-y-3.5'>
                  <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
                    Email Configuration
                  </h3>
                  <TextField name='imapServer' label='IMAP Mail Server' placeholder='imap.gmail.com' register={register} />
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <TextField name='emailAddress' label='Email Address' placeholder='example@gmail.com' register={register} />
                    <TextField
                      name='appPassword'
                      label='App Password'
                      type='password'
                      placeholder='xxxx xxxx xxxx xxxx'
                      register={register}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "personalization" && (
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
            )}

            {activeTab === "schedule" && (
              <div className='space-y-4 animate-fadeIn'>
                <div className='space-y-3.5'>
                  <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
                    Scheduled Tasks & Cron Setup
                  </h3>

                  {scheduleList.length === 0 ? (
                    <p className='text-xs text-text-muted italic bg-bg-secondary/40 p-4 rounded-xl border border-border-color/20'>
                      No scheduled routine tasks configured. Add one below!
                    </p>
                  ) : (
                    <div className='space-y-2'>
                      {scheduleList.map((task, idx) => (
                        <div
                          key={idx}
                          className='flex items-center justify-between bg-bg-secondary/60 p-4 rounded-xl border border-border-color/40 shadow-sm'
                        >
                          <div>
                            <div className='flex items-center gap-2'>
                              <span className='text-xs font-bold text-accent-cyan'>{task.name}</span>
                              <span className='text-[10px] bg-bg-primary border border-border-color px-2.5 py-0.5 rounded text-text-muted font-mono'>
                                {formatTaskScheduleLabel(task)}
                              </span>
                            </div>
                            <p className='mt-1 text-xs text-text-muted line-clamp-1'>{task.prompt}</p>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleRemoveTask(idx)}
                            className='text-[10px] text-accent-red hover:text-accent-red/80 border-none shadow-none font-bold uppercase tracking-wider pl-4'
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className='bg-bg-secondary/40 p-4 rounded-xl border border-border-color/30 mt-4 space-y-3.5'>
                    <h4 className='text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border-color/30 pb-1.5'>
                      Add New Scheduled Task
                    </h4>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <TextField
                        label='Task Name'
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        placeholder='e.g., Morning Briefing Summary'
                      />
                      <div className='space-y-1'>
                        <label className='text-[9.5px] font-bold uppercase tracking-wider text-text-muted select-none'>
                          Frequency Schedule
                        </label>
                        <Dropdown
                          value={newTaskFrequency}
                          onChange={(nextValue) => setNewTaskFrequency(nextValue)}
                          options={frequencyOptions}
                        />
                      </div>
                    </div>

                    <div className='grid gap-4 sm:grid-cols-3 bg-bg-primary/20 p-3 rounded-lg border border-border-color/10'>
                      {newTaskFrequency === "interval" ? (
                        <div className='sm:col-span-3'>
                          <TextField
                            label='Repeat Interval (Minutes)'
                            type='number'
                            min={1}
                            value={newTaskIntervalMinutes}
                            onChange={(e) => setNewTaskIntervalMinutes(Math.max(1, Number(e.target.value)))}
                          />
                        </div>
                      ) : (
                        <>
                          {newTaskFrequency === "monthly" && (
                            <TextField
                              label='Day of Month (1-31)'
                              type='number'
                              min={1}
                              max={31}
                              value={newTaskDayOfMonth}
                              onChange={(e) => setNewTaskDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value))))}
                            />
                          )}

                          {newTaskFrequency === "weekly" && (
                            <div className='space-y-1'>
                              <label className='text-[9.5px] font-bold uppercase tracking-wider text-text-muted select-none'>
                                Day of Week
                              </label>
                              <Dropdown
                                value={String(newTaskDayOfWeek)}
                                onChange={(val) => setNewTaskDayOfWeek(Number(val))}
                                options={[
                                  { label: "Monday", value: "1" },
                                  { label: "Tuesday", value: "2" },
                                  { label: "Wednesday", value: "3" },
                                  { label: "Thursday", value: "4" },
                                  { label: "Friday", value: "5" },
                                  { label: "Saturday", value: "6" },
                                  { label: "Sunday", value: "7" },
                                ]}
                              />
                            </div>
                          )}

                          <TextField
                            label='Hour (0-23)'
                            type='number'
                            min={0}
                            max={23}
                            value={newTaskHour}
                            onChange={(e) => setNewTaskHour(Math.min(23, Math.max(0, Number(e.target.value))))}
                          />

                          <TextField
                            label='Min (0-59)'
                            type='number'
                            min={0}
                            max={59}
                            value={newTaskMinute}
                            onChange={(e) => setNewTaskMinute(Math.min(59, Math.max(0, Number(e.target.value))))}
                          />
                        </>
                      )}
                    </div>

                    <TextField
                      label='AI Agent Prompt Directive'
                      textarea
                      rows={2}
                      value={newTaskPrompt}
                      onChange={(e) => setNewTaskPrompt(e.target.value)}
                      placeholder='What prompt directions should the AI follow at this time? (e.g. check emails, browse tech news)'
                    />
                    <Button variant='primary' fullWidth onClick={handleAddTask}>
                      Add Task to Schedule
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer Action Bar */}
          <footer className='px-8 py-4.5 border-t border-border-color/30 bg-bg-secondary/40 backdrop-blur-md flex justify-end gap-3 select-none'>
            <Button variant='secondary' onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button variant='primary' type='submit'>
              Save Configuration
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}
