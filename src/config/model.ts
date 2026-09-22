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
    label: "Gemini (Recommended - Google AI Studio)",
    providerName: "Gemini",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    modelName: "gemini-3.5-flash-lite",
    maxTokens: 8192,
    models: [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.8-flash",
      "gemma-4-26b",
      "gemma-4-31b",
    ],
  },
  {
    label: "OpenRouter (Free Models)",
    providerName: "OpenRouter",
    apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    modelName: "meta-llama/llama-3.3-70b-instruct:free",
    maxTokens: 8192,
    models: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "deepseek/deepseek-r1:free",
      "qwen/qwen-2.5-coder-32b-instruct:free",
      "mistralai/mistral-small-24b-instruct-2501:free",
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.2-3b-instruct:free",
    ],
  },
  {
    label: "Ollama (Local - 100% Free & Unlimited)",
    providerName: "Ollama",
    apiEndpoint: "http://localhost:11434/v1/chat/completions",
    modelName: "qwen2.5:7b",
    maxTokens: 4096,
    models: [
      "qwen2.5:7b",
      "llama3.2:3b",
      "deepseek-r1:8b",
      "mistral:7b",
      "phi4:14b",
      "gemma2:9b",
    ],
  },
  {
    label: "OpenRouter (Recommended Default)",
    providerName: "OpenRouter",
    apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    modelName: "google/gemini-2.5-flash",
    maxTokens: 16000,
    models: [
      "google/gemini-2.5-flash",
      "google/gemini-2.5-pro",
      "meta-llama/llama-3.3-70b-instruct:free",
      "deepseek/deepseek-r1:free",
      "qwen/qwen-2.5-coder-32b-instruct:free",
      "meta-llama/llama-3-70b-instruct",
      "deepseek/deepseek-chat",
    ],
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
    label: "Gemini Flash (Google Transcription)",
    providerName: "Gemini",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    modelName: "gemini-2.0-flash",
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
