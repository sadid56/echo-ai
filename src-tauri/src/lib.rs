pub mod utils;
pub mod ai;
pub mod system;
pub mod sidecar;

use crate::ai::orchestrator::AppState;
use crate::ai::memory::ChatMemory;
use crate::utils::config::AppConfig;
use std::sync::Mutex;
use tauri::{AppHandle, State, Manager};
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

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
    
    // Set auto startup on macOS based on config setting
    let _ = crate::system::autostart::set_autostart(conf.enable_autostart);
    
    Ok(())
}

#[tauri::command]
fn clear_chat(state: State<'_, AppState>) -> Result<(), String> {
    let mut mem = state.memory.lock().unwrap();
    mem.clear();
    Ok(())
}

#[tauri::command]
async fn transcribe_audio(
    state: State<'_, AppState>,
    audio_base64: String,
    mime_type: String,
) -> Result<String, String> {
    crate::ai::transcribe::transcribe(&state, &audio_base64, &mime_type).await
}

use std::process::{Child, Command};
use std::fs;
use std::path::PathBuf;

static RECORDER_PROCESS: Mutex<Option<Child>> = Mutex::new(None);
static RECORDING_PATH: Mutex<Option<PathBuf>> = Mutex::new(None);

#[tauri::command]
fn start_recording() -> Result<(), String> {
    let mut proc_guard = RECORDER_PROCESS.lock().unwrap();
    if proc_guard.is_some() {
        return Err("Already recording".to_string());
    }

    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join("echo_ai_recording.wav");

    let mut child = Command::new("arecord")
        .args(&["-f", "S16_LE", "-r", "16000", "-c", "1", "-d", "0"])
        .arg(&file_path)
        .spawn();

    if child.is_err() {
        // Fallback to pw-record
        child = Command::new("pw-record")
            .args(&["--format", "s16", "--rate", "16000", "--channels", "1"])
            .arg(&file_path)
            .spawn();
    }

    if child.is_err() {
        // Fallback to parecord
        child = Command::new("parecord")
            .args(&["--format", "s16ne", "--rate", "16000", "--channels", "1"])
            .arg(&file_path)
            .spawn();
    }

    match child {
        Ok(c) => {
            *proc_guard = Some(c);
            let mut path_guard = RECORDING_PATH.lock().unwrap();
            *path_guard = Some(file_path);
            Ok(())
        }
        Err(e) => Err(format!("Could not spawn any system recording tool (arecord/pw-record/parecord). Please ensure alsa-utils, pipewire-utils, or pulseaudio-utils is installed. Error: {}", e)),
    }
}

#[tauri::command]
async fn stop_recording(state: State<'_, AppState>) -> Result<String, String> {
    let file_path = {
        let mut proc_guard = RECORDER_PROCESS.lock().unwrap();
        let child_opt = proc_guard.take();
        let mut child = child_opt.ok_or_else(|| "Not recording".to_string())?;

        let _ = child.kill();
        let _ = child.wait(); 

        let path_guard = RECORDING_PATH.lock().unwrap();
        let file_path_opt = path_guard.as_ref();
        let file_path = file_path_opt.ok_or_else(|| "Recording path not set".to_string())?.clone();
        
        file_path
    };

    if !file_path.exists() {
        return Err("Recording file was not created".to_string());
    }

    // Read the recorded file
    let audio_bytes = fs::read(&file_path)
        .map_err(|e| format!("Failed to read recording file: {}", e))?;

    let _ = fs::remove_file(&file_path);

    if audio_bytes.len() < 100 {
        return Err("Recording is too short or empty".to_string());
    }

    // Convert to base64
    use base64::{Engine as _, engine::general_purpose::STANDARD};
    let audio_base64 = STANDARD.encode(&audio_bytes);

    // Call transcribe
    crate::ai::transcribe::transcribe(&state, &audio_base64, "audio/wav").await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize config and chat history without loading .env files
            let config = AppConfig::default();
            let memory = ChatMemory::new(20);
            
            app.manage(AppState {
                config: Mutex::new(config),
                memory: Mutex::new(memory),
            });
            
            let handle = app.handle().clone();
            crate::system::watcher::start_file_watcher(handle.clone());
            crate::system::scheduler::start_scheduler(handle.clone());
            crate::system::clipboard_helper::start_clipboard_helper(handle);
            
            // System Tray Menu Setup
            let quit_i = MenuItem::with_id(app, "quit", "Quit Echo AI", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show Main Window", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let icon_bytes = include_bytes!("../icons/32x32.png");
            let icon = Image::from_bytes(icon_bytes)?;

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            std::process::exit(0);
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            send_prompt,
            get_config,
            update_config,
            clear_chat,
            transcribe_audio,
            start_recording,
            stop_recording
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
