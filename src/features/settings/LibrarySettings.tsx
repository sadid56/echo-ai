import { useState, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import { Button } from "../../components/ui/button";
import { TextField } from "../../components/ui/textField";
import { Card } from "../../components/ui/Card";
import { SectionHeader } from "../../components/ui/SectionHeader";

interface LibraryPreset {
  id: string;
  name: string;
  provider_name: string;
  api_endpoint: string;
  api_key: string;
  model_name: string;
  max_tokens?: number | null;
}

interface LibrarySettingsProps {
  setValue: UseFormSetValue<any>;
}

export function LibrarySettings({ setValue }: LibrarySettingsProps) {
  const [presets, setPresets] = useState<LibraryPreset[]>([]);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [maxTokens, setMaxTokens] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("echo_ai_library_presets");
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  }, []);

  const savePreset = () => {
    if (!name || !provider || !endpoint || !model) return;

    const newPreset: LibraryPreset = {
      id: Math.random().toString(36).substring(7),
      name,
      provider_name: provider,
      api_endpoint: endpoint,
      api_key: apiKey,
      model_name: model,
      max_tokens: maxTokens ? Number(maxTokens) : null,
    };

    const nextPresets = [...presets, newPreset];
    setPresets(nextPresets);
    localStorage.setItem("echo_ai_library_presets", JSON.stringify(nextPresets));

    setName("");
    setProvider("");
    setEndpoint("");
    setApiKey("");
    setModel("");
    setMaxTokens("");
  };

  const loadPreset = (preset: LibraryPreset) => {
    setValue("text_provider_name", preset.provider_name, { shouldDirty: true });
    setValue("text_api_endpoint", preset.api_endpoint, { shouldDirty: true });
    setValue("text_api_key", preset.api_key, { shouldDirty: true });
    setValue("text_model_name", preset.model_name, { shouldDirty: true });
    setValue("text_max_tokens", preset.max_tokens ? String(preset.max_tokens) : "", { shouldDirty: true });
    alert(`Loaded "${preset.name}" preset details into form!`);
  };

  const deletePreset = (id: string) => {
    const nextPresets = presets.filter((p) => p.id !== id);
    setPresets(nextPresets);
    localStorage.setItem("echo_ai_library_presets", JSON.stringify(nextPresets));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-4">
        <SectionHeader>Configuration Library</SectionHeader>
        <p className="text-xs text-text-muted">
          Save custom AI providers or credentials setup to quickly reload them later.
        </p>

        {presets.length === 0 ? (
          <p className="text-xs text-text-muted italic bg-bg-secondary/40 p-4.5 rounded-2xl border border-border-color/20">
            No saved presets in your library. Add one below!
          </p>
        ) : (
          <div className="space-y-3.5">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between bg-bg-secondary/60 p-4.5 rounded-2xl border border-border-color/30 shadow-sm transition-all duration-200"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-accent-cyan">{preset.name}</span>
                    <span className="text-[10px] bg-bg-primary border border-border-color/60 px-2.5 py-0.5 rounded-lg text-text-muted font-mono">
                      {preset.provider_name} - {preset.model_name}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-text-muted truncate max-w-md">{preset.api_endpoint}</p>
                </div>
                <div className="flex items-center gap-2 pl-4 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => loadPreset(preset)}>
                    Load
                  </Button>
                  <button
                    type="button"
                    onClick={() => deletePreset(preset.id)}
                    className="p-1.5 px-3 rounded-xl hover:bg-accent-red/10 text-accent-red hover:text-accent-red transition-all text-xs font-semibold cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Card className="mt-6 space-y-6">
          <div>
            <h4 className="text-[13px] font-bold uppercase tracking-wider text-text-muted">
              Save Current/New Configuration Setup
            </h4>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField label="Preset Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My OpenRouter Setup" />
            <TextField label="Provider Name" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="OpenRouter" />
          </div>
          <TextField label="API Endpoint URL" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://openrouter.ai/api/v1/chat/completions" />
          <div className="grid gap-6 sm:grid-cols-3">
            <TextField label="API Key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-or-..." />
            <TextField label="Model ID" value={model} onChange={(e) => setModel(e.target.value)} placeholder="google/gemini-2.5-flash" />
            <TextField label="Max Tokens Limit" type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} placeholder="16000" />
          </div>
          <Button variant="primary" fullWidth onClick={savePreset}>
            Save to Preset Library
          </Button>
        </Card>
      </div>
    </div>
  );
}
