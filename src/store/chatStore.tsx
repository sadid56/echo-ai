import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface ApiKeys {
  gemini: string;
  openai: string;
  claude: string;
  local_url: string;
  local_model: string;
}

export interface EmailConfig {
  imap_server: string;
  email_address: string;
  app_password: string;
}

export interface AppConfig {
  active_model: string;
  api_keys: ApiKeys;
  system_prompt: string;
  ai_name: string;
  user_name: string;
  email: EmailConfig;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  model?: string;
  timestamp: string;
}

interface ChatContextType {
  messages: Message[];
  logs: string[];
  config: AppConfig | null;
  loading: boolean;
  addLog: (log: string) => void;
  clearLogs: () => void;
  sendMessage: (prompt: string) => Promise<void>;
  updateConfig: (newConfig: AppConfig) => Promise<void>;
  clearChat: () => Promise<void>;
  refreshConfig: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const addLog = (log: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const clearLogs = () => setLogs([]);

  const refreshConfig = async () => {
    try {
      const saved = localStorage.getItem("echo_ai_config");
      if (saved) {
        let parsed: AppConfig = JSON.parse(saved);
        if (!parsed.api_keys.local_model) {
          parsed.api_keys.local_model = "llama3-groq-tool-use";
          localStorage.setItem("echo_ai_config", JSON.stringify(parsed));
        }
        // Self-heal: If prompt is outdated, reload the new default from config.rs
        if (!parsed.system_prompt.includes("Never make up or hallucinate")) {
          localStorage.removeItem("echo_ai_config");
          const cfg = await invoke<AppConfig>("get_config");
          setConfig(cfg);
          localStorage.setItem("echo_ai_config", JSON.stringify(cfg));
          await invoke("update_config", { config: cfg });
          addLog("Upgraded system prompt to latest default instructions.");
          return;
        }
        setConfig(parsed);
        await invoke("update_config", { config: parsed });
        addLog("Synced settings from local storage.");
      } else {
        const cfg = await invoke<AppConfig>("get_config");
        setConfig(cfg);
        localStorage.setItem("echo_ai_config", JSON.stringify(cfg));
      }
    } catch (err) {
      addLog(`Failed to fetch settings config: ${err}`);
    }
  };

  useEffect(() => {
    refreshConfig();

    const unlisten = listen<string>("sidecar-log", (event) => {
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${event.payload}`]);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const updateConfig = async (newConfig: AppConfig) => {
    try {
      await invoke("update_config", { config: newConfig });
      setConfig(newConfig);
      localStorage.setItem("echo_ai_config", JSON.stringify(newConfig));
      addLog(`AI Configuration saved to local storage.`);
    } catch (err) {
      addLog(`Failed to update config: ${err}`);
      throw err;
    }
  };

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || !config) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    addLog(`User submitted prompt: "${prompt}"`);

    try {
      const result = await invoke<string>("send_prompt", { prompt });
      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: result,
        model: config.active_model,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = String(err);
      addLog(`Orchestrator error: ${errMsg}`);
      const errMessageObj: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: `❌ **Error**: ${errMsg}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errMessageObj]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await invoke("clear_chat");
      setMessages([]);
      addLog("Message memory cleared.");
    } catch (err) {
      addLog(`Failed to clear memory: ${err}`);
    }
  };

  return (
    <ChatContext.Provider
      value={{ messages, logs, config, loading, addLog, clearLogs, sendMessage, updateConfig, clearChat, refreshConfig }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatStore = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatStore must be used within a ChatProvider");
  }
  return context;
};
