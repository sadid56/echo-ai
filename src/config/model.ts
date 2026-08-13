import { DropdownOption } from "../components/ui/dropdown";

export interface ModelPreset {
  label: string;
  providerName: string;
  apiEndpoint: string;
  modelName: string;
  maxTokens?: number | null;
}

export const textModelPresets: ModelPreset[] = [
  {
    label: "OpenRouter (Recommended Default)",
    providerName: "OpenRouter",
    apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    modelName: "google/gemini-2.5-flash",
    maxTokens: 16000,
  },
  {
    label: "OpenAI (GPT-4o)",
    providerName: "OpenAI",
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    modelName: "gpt-4o",
    maxTokens: 4096,
  },
  {
    label: "Gemini 1.5 Flash (Google)",
    providerName: "Gemini",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    modelName: "gemini-1.5-flash",
    maxTokens: 8192,
  },
  {
    label: "GLM-4.5-Flash (Zhipu AI)",
    providerName: "GLM",
    apiEndpoint: "https://api.z.ai/api/paas/v4/chat/completions",
    modelName: "glm-4.5-flash",
    maxTokens: 4096,
  },
  {
    label: "MiniMax M3 (Cloud)",
    providerName: "MiniMax",
    apiEndpoint: "https://api.minimax.io/v1/chat/completions",
    modelName: "MiniMax-M3",
    maxTokens: 4096,
  },
  {
    label: "MiniMax M3 (Local Ollama)",
    providerName: "Ollama",
    apiEndpoint: "http://localhost:11434/v1/chat/completions",
    modelName: "minimax-m3:cloud",
    maxTokens: 2048,
  },
];

export const transcribeModelPresets: ModelPreset[] = [
  {
    label: "OpenAI Whisper (Cloud)",
    providerName: "OpenAI",
    apiEndpoint: "https://api.openai.com/v1/audio/transcriptions",
    modelName: "whisper-1",
  },
  {
    label: "Gemini 1.5 Flash (Google Transcription)",
    providerName: "Gemini",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    modelName: "gemini-1.5-flash",
  },
];

export const textPresetOptions: DropdownOption[] = [
  { label: "Select a Preset Configuration...", value: "" },
  ...textModelPresets.map((preset) => ({
    label: preset.label,
    value: preset.label,
  })),
];

export const transcribePresetOptions: DropdownOption[] = [
  { label: "Select a Preset Configuration...", value: "" },
  ...transcribeModelPresets.map((preset) => ({
    label: preset.label,
    value: preset.label,
  })),
];
