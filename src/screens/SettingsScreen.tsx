import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { AppConfig, useChatStore, ScheduledTask } from "../store/chatStore";
import { SettingsSidebar, SettingsTab, sidebarItems } from "../features/settings/SettingsSidebar";
import { AlertDialog } from "../components/ui/dialog";
import { cn } from "../lib/cn";
// Subcomponents import
import { TextModelSettings } from "../features/settings/TextModelSettings";
import { TranscribeModelSettings } from "../features/settings/TranscribeModelSettings";
import { EmailSettings } from "../features/settings/EmailSettings";
import { GoogleSearchSettings } from "../features/settings/GoogleSearchSettings";
import { PersonalizationSettings } from "../features/settings/PersonalizationSettings";
import { ScheduleSettings } from "../features/settings/ScheduleSettings";
import { LibrarySettings } from "../features/settings/LibrarySettings";
import { TelegramSettings } from "../features/settings/TelegramSettings";
import { TelegramUserSettings } from "../features/settings/TelegramUserSettings";

type SettingsFormValues = {
  text_provider_name: string;
  text_api_endpoint: string;
  text_api_key: string;
  text_model_name: string;
  text_max_tokens: string;

  transcribe_provider_name: string;
  transcribe_api_endpoint: string;
  transcribe_api_key: string;
  transcribe_model_name: string;
  transcribe_max_tokens: string;

  sysPrompt: string;
  aiName: string;
  userName: string;
  imapServer: string;
  emailAddress: string;
  appPassword: string;
  googleSearchApiKey: string;
  googleSearchCseId: string;
  googleSearchEngine: string;

  browser_profile_path: string;
  enable_clipboard_helper: boolean;
  enable_file_watcher: boolean;
  enable_autostart: boolean;
  accent_color: string;
  
  telegramToken: string;
  telegramChatId: string;
  telegramEnabled: boolean;

  telegramUserApiId: string;
  telegramUserApiHash: string;
  telegramUserPhoneNumber: string;
  telegramUserEnabled: boolean;
};

const buildDefaultValues = (config: AppConfig | null): SettingsFormValues => ({
  text_provider_name: config?.text_model?.provider_name ?? "OpenRouter",
  text_api_endpoint: config?.text_model?.api_endpoint ?? "https://openrouter.ai/api/v1/chat/completions",
  text_api_key: config?.text_model?.api_key ?? "",
  text_model_name: config?.text_model?.model_name ?? "google/gemini-2.5-flash",
  text_max_tokens: config?.text_model?.max_tokens ? String(config.text_model.max_tokens) : "",

  transcribe_provider_name: config?.transcribe_model?.provider_name ?? "OpenAI",
  transcribe_api_endpoint: config?.transcribe_model?.api_endpoint ?? "https://api.openai.com/v1/audio/transcriptions",
  transcribe_api_key: config?.transcribe_model?.api_key ?? "",
  transcribe_model_name: config?.transcribe_model?.model_name ?? "whisper-1",
  transcribe_max_tokens: config?.transcribe_model?.max_tokens ? String(config.transcribe_model.max_tokens) : "",

  sysPrompt: config?.system_prompt ?? "",
  aiName: config?.ai_name ?? "Echo",
  userName: config?.user_name ?? "Developer",
  imapServer: config?.email.imap_server ?? "imap.gmail.com",
  emailAddress: config?.email.email_address ?? "",
  appPassword: config?.email.app_password ?? "",
  googleSearchApiKey: config?.google_search?.api_key ?? "",
  googleSearchCseId: config?.google_search?.cse_id ?? "",
  googleSearchEngine: config?.google_search?.engine ?? "duckduckgo",

  browser_profile_path: config?.browser_profile_path ?? "~/.echo-ai/browser-profile",
  enable_clipboard_helper: config?.enable_clipboard_helper ?? false,
  enable_file_watcher: config?.enable_file_watcher ?? false,
  enable_autostart: config?.enable_autostart ?? false,
  accent_color: config?.accent_color ?? "#00f0ff",

  telegramToken: config?.telegram?.token ?? "",
  telegramChatId: config?.telegram?.chat_id ?? "",
  telegramEnabled: config?.telegram?.enabled ?? false,

  telegramUserApiId: config?.telegram_user?.api_id ?? "",
  telegramUserApiHash: config?.telegram_user?.api_hash ?? "",
  telegramUserPhoneNumber: config?.telegram_user?.phone_number ?? "",
  telegramUserEnabled: config?.telegram_user?.enabled ?? false,
});

export function SettingsScreen() {
  const { config, updateConfig } = useChatStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("textModel");
  const [scheduleList, setScheduleList] = useState<ScheduledTask[]>([]);
  
  // Custom Confirmation Dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<SettingsTab | null>(null);
  const [isLeavingSettings, setIsLeavingSettings] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { isDirty } } = useForm<SettingsFormValues>({
    defaultValues: buildDefaultValues(config),
  });

  const isScheduleListDirty = JSON.stringify(scheduleList) !== JSON.stringify(config?.schedule ?? []);
  const isChanged = isDirty || isScheduleListDirty;

  const isInitialized = useRef(false);

  useEffect(() => {
    if (config && !isInitialized.current) {
      reset(buildDefaultValues(config));
      setScheduleList(config.schedule ?? []);
      isInitialized.current = true;
    }
  }, [config, reset]);

  const handleTabChange = (nextTab: SettingsTab) => {
    if (isChanged) {
      setPendingTab(nextTab);
      setIsLeavingSettings(false);
      setConfirmOpen(true);
    } else {
      setActiveTab(nextTab);
    }
  };

  const handleBack = () => {
    if (isChanged) {
      setPendingTab(null);
      setIsLeavingSettings(true);
      setConfirmOpen(true);
    } else {
      navigate("/");
    }
  };

  const handleConfirmDiscard = () => {
    if (config) {
      reset(buildDefaultValues(config));
      setScheduleList(config.schedule ?? []);
    }
    setConfirmOpen(false);
    if (isLeavingSettings) {
      navigate("/");
    } else if (pendingTab) {
      setActiveTab(pendingTab);
    }
  };

  const onSubmit = async (values: SettingsFormValues) => {
    const nextConfig: AppConfig = {
      text_model: {
        provider_name: values.text_provider_name,
        api_endpoint: values.text_api_endpoint,
        api_key: values.text_api_key,
        model_name: values.text_model_name,
        max_tokens: values.text_max_tokens ? Number(values.text_max_tokens) : null,
        models: config?.text_model?.models
      },
      transcribe_model: {
        provider_name: values.transcribe_provider_name,
        api_endpoint: values.transcribe_api_endpoint,
        api_key: values.transcribe_api_key,
        model_name: values.transcribe_model_name,
        max_tokens: values.transcribe_max_tokens ? Number(values.transcribe_max_tokens) : null,
        models: config?.transcribe_model?.models ?? ["whisper-1"],
      },
      system_prompt: values.sysPrompt,
      ai_name: values.aiName,
      user_name: values.userName,
      email: {
        imap_server: values.imapServer,
        email_address: values.emailAddress,
        app_password: values.appPassword,
      },
      google_search: {
        api_key: values.googleSearchApiKey,
        cse_id: values.googleSearchCseId,
        engine: values.googleSearchEngine,
      },
      telegram: {
        token: values.telegramToken,
        chat_id: values.telegramChatId,
        enabled: values.telegramEnabled,
      },
      telegram_user: {
        api_id: values.telegramUserApiId,
        api_hash: values.telegramUserApiHash,
        phone_number: values.telegramUserPhoneNumber,
        enabled: values.telegramUserEnabled,
      },
      browser_profile_path: values.browser_profile_path,
      enable_clipboard_helper: values.enable_clipboard_helper,
      enable_file_watcher: values.enable_file_watcher,
      enable_autostart: values.enable_autostart,
      accent_color: values.accent_color,
      schedule: scheduleList,
    };

    await updateConfig(nextConfig);
    reset(values);
    navigate("/");
  };

  return (
    <div className='flex flex-1 bg-m3-surface text-m3-on-surface overflow-hidden'>
      {/* Desktop Settings Navigation Sidebar */}
      <SettingsSidebar activeTab={activeTab} onTabChange={handleTabChange} onBack={handleBack} />

      {/* Main Settings Form Panel */}
      <div className='flex-1 h-full flex flex-col bg-m3-surface overflow-hidden min-w-0'>
        {/* Mobile Horizontal M3 Category Chips */}
        <div className='md:hidden flex items-center gap-1.5 px-3 py-2 bg-m3-surface-container-low border-b border-m3-outline-variant overflow-x-auto scrollbar-none select-none shrink-0'>
          {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "primary" : "secondary"}
                  size='sm'
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "gap-1.5 px-3 py-1.5 whitespace-nowrap shrink-0",
                    !isActive && "border-m3-outline-variant/60 text-m3-on-surface-variant hover:text-m3-on-surface"
                  )}
                >
                  <Icon className='w-3.5 h-3.5' />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className='flex-1 flex flex-col min-h-0 overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 max-w-3xl min-h-0 select-text scrollbar-none'>
            {activeTab === "textModel" && <TextModelSettings register={register} setValue={setValue} />}
            {activeTab === "transcribeModel" && <TranscribeModelSettings register={register} setValue={setValue} />}
            {activeTab === "email" && <EmailSettings register={register} />}
            {activeTab === "googleSearch" && <GoogleSearchSettings register={register} watch={watch} setValue={setValue} />}
            {activeTab === "telegram" && <TelegramSettings register={register} watch={watch} />}
            {activeTab === "telegramUser" && <TelegramUserSettings register={register} watch={watch} />}
            {activeTab === "personalization" && <PersonalizationSettings register={register} watch={watch} setValue={setValue} />}
            {activeTab === "schedule" && <ScheduleSettings scheduleList={scheduleList} setScheduleList={setScheduleList} />}
            {activeTab === "library" && <LibrarySettings setValue={setValue} />}
          </div>

          {/* Fixed Footer Action Bar with Safe Area Bottom */}
          <footer 
            style={{ paddingBottom: "calc(var(--safe-bottom) + 0.75rem)" }}
            className='px-4 sm:px-8 pt-3 pb-3 sm:py-4 border-t border-m3-outline-variant bg-m3-surface-container-low/95 backdrop-blur-md flex justify-end gap-2.5 select-none shrink-0'
          >
            <Button variant='secondary' size='sm' onClick={handleBack} className='rounded-full px-4 py-2 text-xs font-medium'>
              Cancel
            </Button>
            <Button variant='primary' size='sm' type='submit' disabled={!isChanged} className='rounded-full px-5 py-2 text-xs font-semibold bg-m3-primary text-m3-on-primary hover:brightness-105'>
              Save Configuration
            </Button>
          </footer>
        </form>
      </div>
      <AlertDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to discard your edits? This action cannot be undone."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={handleConfirmDiscard}
        variant="destructive"
      />
    </div>
  );
}
