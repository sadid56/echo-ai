import { DropdownOption } from "../components/ui/dropdown";

export const modelOptions: DropdownOption[] = [
  {
    label: "Gemini 1.5 Flash (Google)",
    value: "Gemini",
    models: [
      {
        label: "Gemini 1.5 Flash",
        value: "gemini-1.5-flash",
        title: "General-purpose fast model for quick coding and everyday prompts.",
        isFree: true,
      },
      {
        label: "Gemini 1.5 Pro",
        value: "gemini-1.5-pro",
        title: "Higher quality reasoning and better instruction following for richer responses.",
        isFree: false,
      },
    ],
  },
  {
    label: "Open AI",
    value: "OpenAI",
    models: [
      {
        label: "GPT-4",
        value: "gpt-4",
        title: "Advanced reasoning and instruction following for complex tasks.",
        isFree: false,
      },
    ],
  },
  {
    label: "GLM (Zhipu AI)",
    value: "GLM",
    models: [
      {
        label: "GLM-4.5-Flash",
        value: "glm-4.5-flash",
        title: "General-purpose fast model for quick coding and everyday prompts.",
        isFree: true,
      },
      {
        label: "GLM-4.7-Flash",
        value: "glm-4.7-flash",
        title: "Higher quality reasoning and better instruction following for richer responses.",
        isFree: false,
      },
      {
        label: "GLM-4.6V-Flash",
        value: "glm-4.6v-flash",
        title: "Vision-capable multimodal model for image-aware and visual tasks.",
        isFree: false,
      },
    ],
  },
];
