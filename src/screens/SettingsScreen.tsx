import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Dropdown } from "../components/ui/dropdown";
import { TextField } from "../components/ui/textField";
import { AppConfig, useChatStore } from "../store/chatStore";
import { modelOptions } from "../config/model";

type SettingsFormValues = {
  model: string;
  geminiKey: string;
  openaiKey: string;
  glmKey: string;
  glmModel: string;
  sysPrompt: string;
  aiName: string;
  userName: string;
  imapServer: string;
  emailAddress: string;
  appPassword: string;
};

const buildDefaultValues = (config: AppConfig | null): SettingsFormValues => ({
  model: config?.active_model ?? "OpenAI",
  geminiKey: config?.api_keys.gemini ?? "",
  openaiKey: config?.api_keys.openai ?? "",
  glmKey: config?.api_keys.glm ?? "",
  glmModel: config?.api_keys.glm_model ?? "glm-4.5-flash",
  sysPrompt: config?.system_prompt ?? "",
  aiName: config?.ai_name ?? "Echo",
  userName: config?.user_name ?? "Developer",
  imapServer: config?.email.imap_server ?? "imap.gmail.com",
  emailAddress: config?.email.email_address ?? "",
  appPassword: config?.email.app_password ?? "",
});

export function SettingsScreen() {
  const { config, updateConfig } = useChatStore();
  const navigate = useNavigate();

  const { register, handleSubmit, reset, watch, setValue } = useForm<SettingsFormValues>({
    defaultValues: buildDefaultValues(config),
  });

  useEffect(() => {
    if (config) {
      reset(buildDefaultValues(config));
    }
  }, [config, reset]);

  const selectedModel = watch("model");
  const selectedGlmModel = watch("glmModel");
  const selectedProvider = modelOptions.find((option) => option.value === selectedModel);
  const glmOptions = selectedProvider?.models ?? [];

  const onSubmit = async (values: SettingsFormValues) => {
    const nextConfig: AppConfig = {
      active_model: values.model,
      api_keys: {
        gemini: values.geminiKey,
        openai: values.openaiKey,
        glm: values.glmKey,
        glm_model: values.glmModel,
      },
      system_prompt: values.sysPrompt,
      ai_name: values.aiName,
      user_name: values.userName,
      email: {
        imap_server: values.imapServer,
        email_address: values.emailAddress,
        app_password: values.appPassword,
      },
    };

    await updateConfig(nextConfig);
    navigate("/");
  };

  return (
    <div className='min-h-screen bg-bg-primary px-4 py-8 text-text-main'>
      <div className='mx-auto w-full max-w-3xl rounded-2xl border border-border-color bg-bg-secondary shadow-2xl'>
        <div className='flex items-center justify-between border-b border-border-color/50 px-6 py-4'>
          <div>
            <p className='text-[10px] font-extrabold uppercase tracking-[0.28rem] text-accent-cyan'>Settings</p>
            <h2 className='mt-1 text-xl font-bold text-text-main'>Application Configuration</h2>
          </div>
          <Button variant='secondary' onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 p-6'>
          <div className='space-y-3.5'>
            <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
              AI Model Selection
            </h3>
            <div className='space-y-1.5'>
              <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted'>Active Provider</label>
              <Dropdown
                value={selectedModel}
                onChange={(nextValue) => setValue("model", nextValue, { shouldDirty: true })}
                options={modelOptions}
              />
            </div>
          </div>

          <div className='space-y-3.5'>
            <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
              API Keys & Endpoint Configuration
            </h3>

            {selectedModel === "Gemini" && (
              <TextField name='geminiKey' label='Gemini API Key' type='password' placeholder='AIzaSy...' register={register} />
            )}

            {selectedModel === "OpenAI" && (
              <TextField name='openaiKey' label='OpenAI API Key' type='password' placeholder='sk-proj-...' register={register} />
            )}

            {selectedModel === "GLM" && (
              <div className='space-y-4'>
                <TextField name='glmKey' label='GLM API Key' type='password' placeholder='9fc193...' register={register} />
                <div className='space-y-1.5'>
                  <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted'>GLM Model</label>
                  <Dropdown
                    value={selectedGlmModel}
                    onChange={(nextValue) => setValue("glmModel", nextValue, { shouldDirty: true })}
                    options={glmOptions}
                  />
                </div>
              </div>
            )}
          </div>

          <div className='space-y-3.5'>
            <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
              Email Configuration
            </h3>
            <TextField name='imapServer' label='IMAP Mail Server' placeholder='imap.gmail.com' register={register} />
            <div className='grid gap-4 sm:grid-cols-2'>
              <TextField name='emailAddress' label='Email Address' placeholder='example@gmail.com' register={register} />
              <TextField name='appPassword' label='App Password' type='password' placeholder='xxxx xxxx xxxx xxxx' register={register} />
            </div>
          </div>

          <div className='space-y-3.5'>
            <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
              Personalization
            </h3>
            <div className='grid gap-4 sm:grid-cols-2'>
              <TextField name='userName' label='User Name' register={register} />
              <TextField name='aiName' label='Assistant Name' register={register} />
            </div>
            <TextField name='sysPrompt' label='Global System Prompt' register={register} textarea rows={4} />
          </div>

          <div className='flex justify-end gap-3 border-t border-border-color/50 pt-4'>
            <Button variant='secondary' onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button variant='primary' type='submit'>
              Save Config
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
