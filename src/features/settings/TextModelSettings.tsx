import { useState } from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { TextField } from "../../components/ui/textField";
import { Dropdown } from "../../components/ui/dropdown";
import { textPresetOptions, textModelPresets } from "../../config/model";
import { useChatStore } from "../../store/chatStore";
import { Plus, X } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/button";
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
      if (preset.models && preset.models.length > 0 && config) {
        updateConfig({
          ...config,
          text_model: {
            ...config.text_model,
            models: preset.models,
          },
        });
      }
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
    <div className='space-y-5 animate-fadeIn'>
      <div className='space-y-4'>
        <SectionHeader>Text Generation Model Setup</SectionHeader>

        {/* Main Model Configuration Card */}
        <Card className='space-y-4 sm:space-y-5 shadow-sm'>
          <div>
            <label className='block text-xs font-medium text-m3-on-surface-variant mb-1.5'>
              Quick Preset Configuration
            </label>
            <Dropdown value='' onChange={handlePresetSelect} options={textPresetOptions} />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <TextField name='text_provider_name' label='Provider Name' placeholder='e.g., OpenRouter, OpenAI, Gemini' register={register} />
            <TextField
              name='text_model_name'
              label='Active Model ID'
              placeholder='e.g., google/gemini-2.5-flash'
              register={register}
            />
          </div>

          <TextField
            name='text_api_endpoint'
            label='API Endpoint URL'
            placeholder='e.g., https://openrouter.ai/api/v1/chat/completions'
            register={register}
          />

          <div className='grid gap-4 sm:grid-cols-3'>
            <div className='sm:col-span-2'>
              <TextField
                name='text_api_key'
                label='API Key'
                type='password'
                placeholder='sk-or-v1-... (leave empty for local models)'
                register={register}
              />
            </div>
            <div>
              <TextField
                name='text_max_tokens'
                label='Max Tokens'
                type='number'
                placeholder='e.g., 4096'
                register={register}
              />
            </div>
          </div>
        </Card>

        {/* Quick Selection Model List Card */}
        <Card className='space-y-3.5 shadow-sm'>
          <div>
            <h4 className='text-xs font-semibold text-m3-on-surface'>Quick Selection Models</h4>
            <p className='text-[11px] text-m3-on-surface-variant mt-0.5'>
              Add model IDs here to quickly switch between them from the chat dock
            </p>
          </div>

          <div className='flex gap-2 items-center'>
            <div className='flex-1'>
              <TextField
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder='e.g. meta-llama/llama-3.3-70b-instruct'
              />
            </div>

            <Button
              variant='primary'
              size='md'
              onClick={handleAddModel}
              className='h-[42px] shrink-0 gap-1.5 px-4'
            >
              <Plus className='h-4 w-4' />
              <span>Add</span>
            </Button>
          </div>

          <div className='flex flex-wrap gap-1.5 pt-1'>
            {(config?.text_model?.models ?? []).length === 0 ? (
              <p className='text-xs text-m3-on-surface-variant/60 italic py-1'>No custom models in list.</p>
            ) : (
              (config?.text_model?.models ?? []).map((modelId) => (
                <div
                  key={modelId}
                  className='inline-flex items-center gap-1.5 bg-m3-surface-container border border-m3-outline-variant hover:border-m3-outline px-3 py-1 rounded-full text-xs text-m3-on-surface transition-all'
                >
                  <span className='font-mono text-[11px] text-m3-on-surface/90'>{modelId}</span>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleRemoveModel(modelId)}
                    className='w-4.5 h-4.5 p-0 text-m3-on-surface-variant hover:text-rose-400 hover:bg-rose-500/15 transition-colors ml-0.5'
                    title='Remove model'
                  >
                    <X className='h-3 w-3' />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
