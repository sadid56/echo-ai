pub mod utils;
pub mod ai;
pub mod system;
pub mod sidecar;

use crate::ai::orchestrator::AppState;
use crate::ai::memory::ChatMemory;
use crate::utils::config::AppConfig;
use std::sync::Mutex;
use tauri::{AppHandle, State, Manager};

#[tauri::command]
async fn send_prompt(
    app: AppHandle,
    state: State<'_, AppState>,
    prompt: String,
) -> Result<String, String> {
    crate::ai::orchestrator::Orchestrator::process_prompt(app, &state, &prompt).await
}

#[tauri::command]
fn get_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
    let conf = state.config.lock().unwrap();
    Ok(conf.clone())
}

#[tauri::command]
fn update_config(state: State<'_, AppState>, config: AppConfig) -> Result<(), String> {
    let mut conf = state.config.lock().unwrap();
    *conf = config;
    
    let mut mem = state.memory.lock().unwrap();
    mem.set_system_prompt(conf.system_prompt.clone());
    Ok(())
}

#[tauri::command]
fn clear_chat(state: State<'_, AppState>) -> Result<(), String> {
    let mut mem = state.memory.lock().unwrap();
    mem.clear();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Load environment variables from .env
            let _ = dotenvy::dotenv();
            
            // Initialize config and chat history
            let config = AppConfig::default();
            let memory = ChatMemory::new(20);
            
            app.manage(AppState {
                config: Mutex::new(config),
                memory: Mutex::new(memory),
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            send_prompt,
            get_config,
            update_config,
            clear_chat
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
