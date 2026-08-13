import React, { useState } from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { TextField } from "../../components/ui/textField";
import { Dropdown } from "../../components/ui/dropdown";
import { Button } from "../../components/ui/button";
import { textPresetOptions, textModelPresets } from "../../config/model";
import { useChatStore } from "../../store/chatStore";

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
        models: currentModels.filter(m => m !== modelToRemove),
      },
    };
    updateConfig(updated);
  };

  return (
    <div className='space-y-4 animate-fadeIn'>
      <div className='space-y-3.5'>
        <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
          Text Generation Model Setup
        </h3>
        <div className='space-y-1.5'>
          <label className='text-[10px] font-semibold uppercase tracking-wider text-text-muted'>Load from Preset</label>
          <Dropdown value='' onChange={handlePresetSelect} options={textPresetOptions} />
        </div>
        <TextField
          name='text_provider_name'
          label='Provider Name'
          placeholder='e.g., OpenAI, Gemini, OpenRouter'
          register={register}
        />
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

        {/* Dynamic Model List Management UI */}
        <div className='bg-bg-secondary/40 p-4 rounded-xl border border-border-color/30 mt-4 space-y-3'>
          <h4 className='text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border-color/30 pb-1.5'>
            Manage Available Models / ID List
          </h4>
          <div className='flex gap-2 items-end'>
            <div className='flex-1'>
              <TextField
                label='Add Model ID to List'
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder='e.g. meta-llama/llama-3.1-405b'
              />
            </div>
            <Button variant='primary' type='button' onClick={handleAddModel}>
              Add
            </Button>
          </div>

          <div className='flex flex-wrap gap-2 mt-2'>
            {(config?.text_model?.models ?? []).map((modelId) => (
              <div
                key={modelId}
                className='flex items-center gap-1.5 bg-bg-primary border border-border-color px-2.5 py-1 rounded text-xs text-text-main'
              >
                <span className='font-mono'>{modelId}</span>
                <button
                  type='button'
                  onClick={() => handleRemoveModel(modelId)}
                  className='text-[10px] text-accent-red font-bold hover:text-accent-red/80 ml-1.5'
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
