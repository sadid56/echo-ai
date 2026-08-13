import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { TextField } from "../../components/ui/textField";
import { Dropdown } from "../../components/ui/dropdown";
import { transcribePresetOptions, transcribeModelPresets } from "../../config/model";

interface TranscribeModelSettingsProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
}

export function TranscribeModelSettings({ register, setValue }: TranscribeModelSettingsProps) {
  const handlePresetSelect = (presetLabel: string) => {
    const preset = transcribeModelPresets.find((p) => p.label === presetLabel);
    if (preset) {
      setValue("transcribe_provider_name", preset.providerName, { shouldDirty: true });
      setValue("transcribe_api_endpoint", preset.apiEndpoint, { shouldDirty: true });
      setValue("transcribe_model_name", preset.modelName, { shouldDirty: true });
      setValue("transcribe_max_tokens", preset.maxTokens ? String(preset.maxTokens) : "", { shouldDirty: true });
    }
  };

  return (
    <div className='space-y-4 animate-fadeIn'>
      <div className='space-y-3.5'>
        <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
          Audio Transcription Model Setup
        </h3>
        <div className='space-y-1.5'>
          <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted'>Load from Preset</label>
          <Dropdown value='' onChange={handlePresetSelect} options={transcribePresetOptions} />
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
        <TextField
          name='transcribe_max_tokens'
          label='Max Tokens'
          type='number'
          placeholder='Leave blank unless provider requires it'
          register={register}
        />
      </div>
    </div>
  );
}
