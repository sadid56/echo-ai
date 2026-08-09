import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { AppConfig } from "../store/chatStore";

export const useTauriCommands = (onLogReceived?: (log: string) => void) => {
  const sendPrompt = async (prompt: string): Promise<string> => {
    return await invoke<string>("send_prompt", { prompt });
  };

  const getConfig = async (): Promise<AppConfig> => {
    return await invoke<AppConfig>("get_config");
  };

  const saveConfig = async (config: AppConfig): Promise<void> => {
    await invoke("update_config", { config });
  };

  const clearChatHistory = async (): Promise<void> => {
    await invoke("clear_chat");
  };

  useEffect(() => {
    if (!onLogReceived) return;

    let active = true;
    const unlistenPromise = listen<string>("sidecar-log", (event) => {
      if (active) {
        onLogReceived(event.payload);
      }
    });

    return () => {
      active = false;
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [onLogReceived]);

  return {
    sendPrompt,
    getConfig,
    saveConfig,
    clearChatHistory,
  };
};
