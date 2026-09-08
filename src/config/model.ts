import { DropdownOption } from "../components/ui/dropdown";

export interface ModelPreset {
  label: string;
  providerName: string;
  apiEndpoint: string;
  modelName: string;
  maxTokens?: number | null;
  models?: string[];
}

export const textModelPresets: ModelPreset[] = [
  {
    label: "OpenRouter (Recommended Default)",
    providerName: "OpenRouter",
    apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    modelName: "google/gemini-2.5-flash",
    maxTokens: 16000,
    models: ["google/gemini-2.5-flash", "google/gemini-2.5-pro", "meta-llama/llama-3-70b-instruct", "deepseek/deepseek-chat"],
  },
  {
    label: "Groq",
    providerName: "Groq",
    apiEndpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "llama-3.3-70b-versatile",
    maxTokens: 8192,
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "deepseek-r1-distill-llama-70b", "mixtral-8x7b-32768", "gemma2-9b-it"],
  },
  {
    label: "OpenAI",
    providerName: "OpenAI",
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    modelName: "gpt-4o",
    maxTokens: 4096,
    models: ["gpt-4o", "gpt-4o-mini", "o1-preview", "o1-mini"],
  },
  {
    label: "Gemini",
    providerName: "Gemini",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    modelName: "gemini-1.5-flash",
    maxTokens: 8192,
    models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"],
  },
  {
    label: "GLM",
    providerName: "GLM",
    apiEndpoint: "https://api.z.ai/api/paas/v4/chat/completions",
    modelName: "glm-4.5-flash",
    maxTokens: 4096,
    models: ["glm-4.5-flash", "glm-4-plus"],
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
    label: "Groq Whisper (whisper-large-v3)",
    providerName: "Groq",
    apiEndpoint: "https://api.groq.com/openai/v1/audio/transcriptions",
    modelName: "whisper-large-v3",
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
