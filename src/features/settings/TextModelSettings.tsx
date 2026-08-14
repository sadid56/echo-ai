import { useState } from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { TextField } from "../../components/ui/textField";
import { Dropdown } from "../../components/ui/dropdown";
import { textPresetOptions, textModelPresets } from "../../config/model";
import { useChatStore } from "../../store/chatStore";
import { Plus, X } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { SectionHeader } from "../../components/ui/SectionHeader";

interface TextModelSettingsProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
}

export function TextModelSettings({ register, setValue }: TextModelSettingsProps) {
  const { config, updateConfig } = useChatStore();
  const [newModel, setNewModel] = useState("");

  const handlePresetSelect = (presetLabel: string) => {
    const preset = textModelPresets.find((p) => p.label === presetLabel);
    if (preset) {
      setValue("text_provider_name", preset.providerName, { shouldDirty: true });
      setValue("text_api_endpoint", preset.apiEndpoint, { shouldDirty: true });
      setValue("text_model_name", preset.modelName, { shouldDirty: true });
      setValue("text_max_tokens", preset.maxTokens ? String(preset.maxTokens) : "", { shouldDirty: true });
    }
  };

  const handleAddModel = () => {
    if (!newModel.trim() || !config) return;
    const currentModels = config.text_model.models ?? [];
    if (!currentModels.includes(newModel.trim())) {
      const updated = {
        ...config,
        text_model: {
          ...config.text_model,
          models: [...currentModels, newModel.trim()],
        },
      };
      updateConfig(updated);
    }
    setNewModel("");
  };

  const handleRemoveModel = (modelToRemove: string) => {
    if (!config) return;
    const currentModels = config.text_model.models ?? [];
    const updated = {
      ...config,
      text_model: {
        ...config.text_model,
        models: currentModels.filter((m) => m !== modelToRemove),
      },
    };
    updateConfig(updated);
  };

  return (
    <div className='space-y-6 animate-fadeIn'>
      <div className='space-y-4'>
        <SectionHeader>Text Generation Model Setup</SectionHeader>

        <div className='space-y-6'>
          <Dropdown value='' onChange={handlePresetSelect} options={textPresetOptions} />
          <TextField name='text_provider_name' label='Provider Name' placeholder='e.g., OpenAI, Gemini, OpenRouter' register={register} />
          <TextField
            name='text_api_endpoint'
            label='API Endpoint URL'
            placeholder='e.g., https://openrouter.ai/api/v1/chat/completions'
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
            label='Active Model Name (ID)'
            placeholder='e.g., google/gemini-2.5-flash'
            register={register}
          />
          <TextField
            name='text_max_tokens'
            label='Max Tokens'
            type='number'
            placeholder='Max generation length (e.g. 4096). Leave blank for API default'
            register={register}
          />
        </div>

        <Card className='mt-6 space-y-4'>
          <div>
            <p className='text-[14px] text-text-muted mt-0.5'>Add custom model IDs to your quick selection list</p>
          </div>

          <div className='flex gap-2.5 items-center'>
            <div className='flex-1'>
              <TextField
                label='Add Model ID to List'
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder='e.g. meta-llama/llama-3.1-405b'
              />
            </div>

            <button
              type='button'
              onClick={handleAddModel}
              className='h-[42px] px-4 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan font-semibold text-xs transition-all duration-200 active:scale-95 flex items-center gap-1.5 shrink-0 border border-accent-cyan/20 cursor-pointer'
            >
              <Plus className='h-4 w-4' />
              <span>Add</span>
            </button>
          </div>

          <div className='flex flex-wrap gap-2 pt-1'>
            {(config?.text_model?.models ?? []).length === 0 ? (
              <p className='text-xs text-text-muted/60 italic py-1'>No custom models added yet.</p>
            ) : (
              (config?.text_model?.models ?? []).map((modelId) => (
                <div
                  key={modelId}
                  className='inline-flex items-center gap-1.5 bg-bg-primary/80 border border-border-color hover:border-accent-cyan/40 px-3 py-1.5 rounded-xl text-xs text-text-main transition-all duration-200 group'
                >
                  <span className='font-mono text-[11px] text-text-main/90'>{modelId}</span>
                  <button
                    type='button'
                    onClick={() => handleRemoveModel(modelId)}
                    className='p-0.5 rounded-full hover:bg-accent-red/20 text-text-muted hover:text-accent-red transition-colors cursor-pointer ml-0.5'
                    title='Remove model'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
