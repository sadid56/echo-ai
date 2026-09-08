import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const defaultWebConfig: AppConfig = {
  text_model: {
    provider_name: "OpenRouter",
    api_endpoint: "https://openrouter.ai/api/v1/chat/completions",
    api_key: "",
    model_name: "google/gemini-2.5-flash",
    max_tokens: 16000,
    models: [
      "google/gemini-2.5-flash",
      "google/gemini-2.5-pro",
      "meta-llama/llama-3-70b-instruct",
      "deepseek/deepseek-chat"
    ],
  },
  transcribe_model: {
    provider_name: "OpenAI",
    api_endpoint: "https://api.openai.com/v1/audio/transcriptions",
    api_key: "",
    model_name: "whisper-1",
    max_tokens: null,
    models: ["whisper-1"],
  },
  system_prompt: "You are Echo, a personal AI assistant developed by Sadid. Be friendly, accurate, and responsive with appropriate emojis. 😊",
  ai_name: "Echo",
  user_name: "Developer",
  email: { imap_server: "", email_address: "", app_password: "" },
  google_search: { api_key: "", cse_id: "", engine: "duckduckgo" },
  telegram: { token: "", chat_id: "", enabled: false },
  telegram_user: { api_id: "", api_hash: "", phone_number: "", enabled: false },
  browser_profile_path: "~/.echo-ai/browser-profile",
  enable_clipboard_helper: false,
  enable_file_watcher: false,
  enable_autostart: false,
  accent_color: "#5eead4",
  schedule: [],
};

export interface ModelConfig {
  provider_name: string;
  api_endpoint: string;
  api_key: string;
  model_name: string;
  max_tokens?: number | null;
  models?: string[];
}

export interface EmailConfig {
  imap_server: string;
  email_address: string;
  app_password: string;
}

export interface ScheduledTask {
  name: string;
  frequency: string;
  day_of_month?: number | null;
  day_of_week?: number | null;
  hour?: number | null;
  minute?: number | null;
  interval_minutes?: number | null;
  prompt: string;
}

export interface GoogleSearchConfig {
  api_key: string;
  cse_id: string;
  engine: string;
}

export interface TelegramConfig {
  token: string;
  chat_id: string;
  enabled: boolean;
}

export interface TelegramUserConfig {
  api_id: string;
  api_hash: string;
  phone_number: string;
  enabled: boolean;
}

export interface AppConfig {
  text_model: ModelConfig;
  transcribe_model: ModelConfig;
  system_prompt: string;
  ai_name: string;
  user_name: string;
  email: EmailConfig;
  google_search: GoogleSearchConfig;
  telegram: TelegramConfig;
  telegram_user: TelegramUserConfig;
  browser_profile_path: string;
  enable_clipboard_helper: boolean;
  enable_file_watcher: boolean;
  enable_autostart: boolean;
  accent_color: string;
  schedule: ScheduledTask[];
}

export interface Attachment {
  name: string;
  mime_type: string;
  data: string; // base64 encoded data
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  model?: string;
  timestamp: string;
  attachments?: Attachment[];
  tokens_used?: number;
}

export interface SearchStats {
  date: string;
  count: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

const STORAGE_KEY_SESSIONS = "echo_ai_chat_sessions";

const loadSessionsFromStorage = (): ChatSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveSessionsToStorage = (sessions: ChatSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.error("Failed to save sessions to localStorage:", err);
  }
};

const syncBackendMemory = async (messages: Message[]) => {
  if (!isTauri) return;
  try {
    const rustMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: m.content,
        name: null,
        tool_calls: null,
      }));
    await invoke("set_chat_history", { messages: rustMessages });
  } catch (err) {
    console.error("Failed to sync backend memory:", err);
  }
};

interface ChatStore {
  messages: Message[];
  sessions: ChatSession[];
  activeSessionId: string | null;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  logs: string[];
  config: AppConfig | null;
  showLogs: boolean;
  setShowLogs: (show: boolean) => void;
  loading: boolean;
  addLog: (log: string) => void;
  clearLogs: () => void;
  sendMessage: (prompt: string, attachments?: Attachment[]) => Promise<void>;
  stopChat: () => void;
  updateConfig: (newConfig: AppConfig) => Promise<void>;
  clearChat: () => Promise<void>;
  newChat: () => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => void;
  refreshConfig: () => Promise<void>;
  searchStats: SearchStats;
  incrementSearchCount: () => void;
}

const initialSessions = loadSessionsFromStorage();
const initialActiveSession = initialSessions.length > 0 ? initialSessions[0] : null;

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: initialSessions,
  activeSessionId: initialActiveSession ? initialActiveSession.id : null,
  messages: initialActiveSession ? initialActiveSession.messages : [],
  showHistory: false,
  setShowHistory: (show: boolean) => set({ showHistory: show }),
  logs: [],
  config: null,
  loading: false,
  showLogs: false,
  setShowLogs: (show: boolean) => set({ showLogs: show }),

  addLog: (log: string) => {
    set((state) => ({
      logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${log}`],
    }));
  },

  clearLogs: () => set({ logs: [] }),

  newChat: async () => {
    set({ activeSessionId: null, messages: [] });
    try {
      await invoke("clear_chat");
      get().addLog("Started a new chat session.");
    } catch (err) {
      get().addLog(`Failed to reset backend memory for new chat: ${err}`);
    }
  },

  selectSession: async (sessionId: string) => {
    const { sessions, activeSessionId } = get();
    if (activeSessionId === sessionId) {
      set({ showHistory: false });
      return;
    }
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    set({ activeSessionId: session.id, messages: session.messages, showHistory: false });
    await syncBackendMemory(session.messages);
    get().addLog(`Switched to chat session: "${session.title}"`);
  },

  deleteSession: async (sessionId: string) => {
    const { sessions, activeSessionId } = get();
    const updated = sessions.filter((s) => s.id !== sessionId);
    saveSessionsToStorage(updated);
    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        const next = updated[0];
        set({ sessions: updated, activeSessionId: next.id, messages: next.messages });
        await syncBackendMemory(next.messages);
      } else {
        set({ sessions: [], activeSessionId: null, messages: [] });
        try {
          await invoke("clear_chat");
        } catch (_) {}
      }
    } else {
      set({ sessions: updated });
    }
    get().addLog("Chat session deleted.");
  },

  clearAllHistory: async () => {
    saveSessionsToStorage([]);
    set({ sessions: [], activeSessionId: null, messages: [] });
    try {
      await invoke("clear_chat");
    } catch (_) {}
    get().addLog("All chat history cleared.");
  },

  renameSession: (sessionId: string, newTitle: string) => {
    const { sessions } = get();
    const updated = sessions.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s));
    saveSessionsToStorage(updated);
    set({ sessions: updated });
  },

  searchStats: {
    date: new Date().toLocaleDateString(),
    count: 0,
  },

  incrementSearchCount: () => {
    const today = new Date().toLocaleDateString();
    set((state) => {
      const current = state.searchStats;
      const newStats = current.date === today 
        ? { date: today, count: current.count + 1 }
        : { date: today, count: 1 };
      localStorage.setItem("echo_ai_search_stats", JSON.stringify(newStats));
      return { searchStats: newStats };
    });
  },

  refreshConfig: async () => {
    // Load search stats
    const today = new Date().toLocaleDateString();
    const statsSaved = localStorage.getItem("echo_ai_search_stats");
    if (statsSaved) {
      try {
        const parsedStats = JSON.parse(statsSaved);
        if (parsedStats.date === today) {
          set({ searchStats: parsedStats });
        } else {
          const resetStats = { date: today, count: 0 };
          set({ searchStats: resetStats });
          localStorage.setItem("echo_ai_search_stats", JSON.stringify(resetStats));
        }
      } catch (_) {}
    } else {
      const resetStats = { date: today, count: 0 };
      set({ searchStats: resetStats });
      localStorage.setItem("echo_ai_search_stats", JSON.stringify(resetStats));
    }
    if (!isTauri) {
      const saved = localStorage.getItem("echo_ai_config");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          set({ config: parsed });
          if (parsed.accent_color) {
            document.documentElement.style.setProperty("--accent-color-hex", parsed.accent_color);
          }
          return;
        } catch (_) {}
      }
      set({ config: defaultWebConfig });
      localStorage.setItem("echo_ai_config", JSON.stringify(defaultWebConfig));
      return;
    }

    try {
      const saved = localStorage.getItem("echo_ai_config");
      if (saved) {
        let parsed: any = JSON.parse(saved);

        if (!parsed.text_model || !parsed.transcribe_model) {
          localStorage.removeItem("echo_ai_config");
          const cfg = await invoke<AppConfig>("get_config");
          set({ config: cfg });
          localStorage.setItem("echo_ai_config", JSON.stringify(cfg));
          await invoke("update_config", { config: cfg });
          get().addLog("Migrated legacy configuration to unified dynamic model format.");
          return;
        }

        // Self-heal new max_tokens settings fields
        let dirty = false;
        if (parsed.text_model && parsed.text_model.max_tokens === undefined) {
          parsed.text_model.max_tokens = 4096;
          dirty = true;
        }
        if (parsed.text_model && parsed.text_model.models === undefined) {
          parsed.text_model.models = [
            "google/gemini-2.5-flash",
            "google/gemini-2.5-pro",
            "meta-llama/llama-3-70b-instruct",
            "deepseek/deepseek-chat"
          ];
          dirty = true;
        }
        if (parsed.transcribe_model && parsed.transcribe_model.max_tokens === undefined) {
          parsed.transcribe_model.max_tokens = null;
          dirty = true;
        }
        if (parsed.transcribe_model && parsed.transcribe_model.models === undefined) {
          parsed.transcribe_model.models = ["whisper-1"];
          dirty = true;
        }
        if (parsed.browser_profile_path === undefined) {
          parsed.browser_profile_path = "~/.echo-ai/browser-profile";
          dirty = true;
        }
        if (parsed.enable_clipboard_helper === undefined) {
          parsed.enable_clipboard_helper = false;
          dirty = true;
        }
        if (parsed.enable_file_watcher === undefined) {
          parsed.enable_file_watcher = false;
          dirty = true;
        }
        if (parsed.enable_autostart === undefined) {
          parsed.enable_autostart = false;
          dirty = true;
        }
        if (parsed.accent_color === undefined) {
          parsed.accent_color = "#00f0ff";
          dirty = true;
        }
        if (parsed.google_search === undefined) {
          parsed.google_search = {
            api_key: "",
            cse_id: "",
            engine: "duckduckgo",
          };
          dirty = true;
        } else if (parsed.google_search.engine === undefined) {
          parsed.google_search.engine = "duckduckgo";
          dirty = true;
        }
        if (parsed.telegram === undefined) {
          parsed.telegram = {
            token: "",
            chat_id: "",
            enabled: false,
          };
          dirty = true;
        }
        if (parsed.telegram_user === undefined) {
          parsed.telegram_user = {
            api_id: "",
            api_hash: "",
            phone_number: "",
            enabled: false,
          };
          dirty = true;
        }
        if (parsed.schedule === undefined) {
          parsed.schedule = [
            {
              name: "Morning briefing",
              frequency: "daily",
              day_of_month: null,
              day_of_week: null,
              hour: 9,
              minute: 0,
              interval_minutes: null,
              prompt: "Check for unread emails and summarize them.",
            },
          ];
          dirty = true;
        } else {
          let scheduleMigrated = false;
          parsed.schedule = parsed.schedule.map((task: any) => {
            if (task.frequency === undefined) {
              scheduleMigrated = true;
              return {
                name: task.name,
                frequency: "daily",
                day_of_month: null,
                day_of_week: null,
                hour: task.hour ?? 9,
                minute: task.minute ?? 0,
                interval_minutes: null,
                prompt: task.prompt,
              };
            }
            return task;
          });
          if (scheduleMigrated) {
            dirty = true;
          }
        }

        if (dirty) {
          localStorage.setItem("echo_ai_config", JSON.stringify(parsed));
          get().addLog("Initialized default productivity settings for existing config.");
        }

        // Self-heal: If prompt is outdated, reload the new default from config.rs
        if (!parsed.system_prompt.includes("google_search") || !parsed.system_prompt.includes("Never make up or hallucinate") || !parsed.system_prompt.includes("Full Stack developer from Bangladesh")) {
          localStorage.removeItem("echo_ai_config");
          const cfg = await invoke<AppConfig>("get_config");
          set({ config: cfg });
          localStorage.setItem("echo_ai_config", JSON.stringify(cfg));
          await invoke("update_config", { config: cfg });
          get().addLog("Upgraded system prompt to latest default instructions.");
          return;
        }

        if (parsed.accent_color) {
          document.documentElement.style.setProperty("--accent-color-hex", parsed.accent_color);
        }

        set({ config: parsed });
        await invoke("update_config", { config: parsed });
        get().addLog("Synced settings from local storage.");
      } else {
        const cfg = await invoke<AppConfig>("get_config");

        if (cfg.accent_color) {
          document.documentElement.style.setProperty("--accent-color-hex", cfg.accent_color);
        }

        set({ config: cfg });
        localStorage.setItem("echo_ai_config", JSON.stringify(cfg));
      }
    } catch (err) {
      get().addLog(`Failed to fetch settings config: ${err}`);
    }
  },

  updateConfig: async (newConfig: AppConfig) => {
    try {
      if (isTauri) {
        await invoke("update_config", { config: newConfig });
      }

      if (newConfig.accent_color) {
        document.documentElement.style.setProperty("--accent-color-hex", newConfig.accent_color);
      }

      set({ config: newConfig });
      localStorage.setItem("echo_ai_config", JSON.stringify(newConfig));
      get().addLog(`AI Configuration saved to local storage.`);
    } catch (err) {
      get().addLog(`Failed to update config: ${err}`);
      throw err;
    }
  },

  sendMessage: async (prompt: string, attachments?: Attachment[]) => {
    const { config } = get();
    if (!prompt.trim() || !config) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString(),
      attachments,
    };

    let currentSessionId = get().activeSessionId;
    let sessions = get().sessions;

    if (!currentSessionId) {
      currentSessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substring(7);
      const title = prompt.trim().slice(0, 36) + (prompt.trim().length > 36 ? "..." : "");
      const newSession: ChatSession = {
        id: currentSessionId,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMsg],
      };
      sessions = [newSession, ...sessions];
      saveSessionsToStorage(sessions);
      set({
        sessions,
        activeSessionId: currentSessionId,
        messages: [userMsg],
        loading: true,
      });
    } else {
      const updatedSessions = sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, updatedAt: Date.now(), messages: [...s.messages, userMsg] }
          : s
      );
      saveSessionsToStorage(updatedSessions);
      set((state) => ({
        messages: [...state.messages, userMsg],
        sessions: updatedSessions,
        loading: true,
      }));
    }

    get().addLog(`User submitted prompt: "${prompt}"${attachments?.length ? ` with ${attachments.length} attachments` : ""}`);

    try {
      interface OrchestratorResult {
        content: string;
        tokens_used: number;
      }
      let result: OrchestratorResult;

      if (isTauri) {
        result = await invoke<OrchestratorResult>("send_prompt", { prompt, attachments: attachments || null });
      } else {
        // Direct browser call for phone testing without Android Studio
        if (config.text_model.api_key) {
          const res = await fetch(config.text_model.api_endpoint || "https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${config.text_model.api_key}`,
            },
            body: JSON.stringify({
              model: config.text_model.model_name,
              messages: [
                { role: "system", content: config.system_prompt },
                ...get().messages.map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: prompt },
              ],
            }),
          });
          if (!res.ok) {
            throw new Error(`OpenRouter Error ${res.status}: ${await res.text()}`);
          }
          const json = await res.json();
          result = {
            content: json.choices?.[0]?.message?.content || "No response received.",
            tokens_used: json.usage?.total_tokens || 0,
          };
        } else {
          result = {
            content: `Hello from Echo AI! 👋✨\n\nYou are successfully testing Echo directly from your phone browser without installing Android Studio!\n\nTo chat with real AI models in Mobile Web Mode, open **Settings (⚙️)** in the top bar and add your **OpenRouter API Key**.\n\nAll Material You 3 UI features, touch gestures, navigation drawer, and themes are fully responsive! 🎨📱`,
            tokens_used: 35,
          };
        }
      }

      if (!get().loading) return; // Ignore response if user aborted prompt execution

      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: result.content,
        model: config.text_model.model_name,
        timestamp: new Date().toLocaleTimeString(),
        tokens_used: result.tokens_used,
      };

      const updatedSessions = get().sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, updatedAt: Date.now(), messages: [...s.messages, assistantMsg] }
          : s
      );
      saveSessionsToStorage(updatedSessions);

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        sessions: updatedSessions,
      }));
    } catch (err) {
      const errMsg = String(err);
      get().addLog(`Orchestrator error: ${errMsg}`);
      const friendlyMessage =
        errMsg.includes("repeated tool loop") || errMsg.includes("Maximum tool execution loops reached")
          ? "⚠️ I stopped after a repeated tool cycle to avoid looping. Please try a smaller or clearer task."
          : `⚠️ ${errMsg}`;

      const errMessageObj: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: friendlyMessage,
        timestamp: new Date().toLocaleTimeString(),
      };

      const updatedSessions = get().sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, updatedAt: Date.now(), messages: [...s.messages, errMessageObj] }
          : s
      );
      saveSessionsToStorage(updatedSessions);

      set((state) => ({
        messages: [...state.messages, errMessageObj],
        sessions: updatedSessions,
      }));
    } finally {
      set({ loading: false });
    }
  },

  stopChat: () => {
    set({ loading: false });
    get().addLog("User interrupted execution.");
  },

  clearChat: async () => {
    try {
      if (isTauri) {
        await invoke("clear_chat");
      }
      const { activeSessionId, sessions } = get();
      if (activeSessionId) {
        const updated = sessions.map((s) =>
          s.id === activeSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s
        );
        saveSessionsToStorage(updated);
        set({ messages: [], sessions: updated });
      } else {
        set({ messages: [] });
      }
      get().addLog("Message memory cleared.");
    } catch (err) {
      get().addLog(`Failed to clear memory: ${err}`);
    }
  },
}));

useChatStore.getState().refreshConfig();

if (isTauri) {
  if (initialActiveSession && initialActiveSession.messages.length > 0) {
    syncBackendMemory(initialActiveSession.messages);
  }

  listen<string>("sidecar-log", (event) => {
    useChatStore.getState().addLog(event.payload);
  });

  listen("google-search-performed", () => {
    useChatStore.getState().incrementSearchCount();
  });
}
