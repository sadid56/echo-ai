use std::path::PathBuf;
use std::process::Stdio;
use std::sync::OnceLock;
use tauri::{AppHandle, Manager, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader, AsyncWriteExt};
use tokio::process::Command;
use serde_json::json;
use crate::ai::orchestrator::AppState;

static TELEGRAM_USER_LOGIN_PROCESS: OnceLock<tokio::sync::Mutex<Option<tokio::process::ChildStdin>>> = OnceLock::new();

fn get_login_process() -> &'static tokio::sync::Mutex<Option<tokio::process::ChildStdin>> {
    TELEGRAM_USER_LOGIN_PROCESS.get_or_init(|| tokio::sync::Mutex::new(None))
}

fn get_python_executable() -> String {
    let cur_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let venv_local = cur_dir.join(".venv").join("bin").join("python3");
    if venv_local.exists() {
        return venv_local.to_string_lossy().to_string();
    }
    if let Some(parent) = cur_dir.parent() {
        let venv_parent = parent.join(".venv").join("bin").join("python3");
        if venv_parent.exists() {
            return venv_parent.to_string_lossy().to_string();
        }
    }
    let venv_win_local = cur_dir.join(".venv").join("Scripts").join("python.exe");
    if venv_win_local.exists() {
        return venv_win_local.to_string_lossy().to_string();
    }
    "python3".to_string()
}

fn get_script_path() -> PathBuf {
    let mut script_path = PathBuf::from(".");
    script_path.push("sidecars");
    script_path.push("telegram_user_agent.py");
    if !script_path.exists() {
        script_path = PathBuf::from("..");
        script_path.push("sidecars");
        script_path.push("telegram_user_agent.py");
    }
    script_path
}

#[tauri::command]
pub async fn start_telegram_user_bridge(app: AppHandle) -> Result<(), String> {
    let mut proc_guard = get_login_process().lock().await;
    if proc_guard.is_some() {
        return Ok(());
    }

    let state = app.state::<AppState>();
    let (api_id, api_hash, phone) = {
        let conf = state.config.lock().unwrap();
        (conf.telegram_user.api_id.clone(), conf.telegram_user.api_hash.clone(), conf.telegram_user.phone_number.clone())
    };

    if api_id.is_empty() || api_hash.is_empty() || phone.is_empty() {
        return Err("API ID, API Hash, and Phone Number must be configured in settings first.".to_string());
    }

    let mut child = Command::new(get_python_executable())
        .arg(get_script_path())
        .arg(&api_id)
        .arg(&api_hash)
        .arg(&phone)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| format!("Failed to spawn Python process: {}", e))?;

    let stdin = child.stdin.take().ok_or("Failed to open stdin")?;
    *proc_guard = Some(stdin);

    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let app_clone = app.clone();

    tauri::async_runtime::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let line = line.trim();
            if line == "STATUS:AUTH_REQUIRED" {
                let _ = app_clone.emit("telegram-user-status", "auth_required");
            } else if line == "STATUS:PASSWORD_REQUIRED" {
                let _ = app_clone.emit("telegram-user-status", "password_required");
            } else if line == "STATUS:CONNECTED" {
                let _ = app_clone.emit("telegram-user-status", "connected");
                // Login complete, we can kill the login flow child process
                let mut guard = get_login_process().lock().await;
                *guard = None;
                break;
            } else if line.starts_with("STATUS:INSTALLING_TELETHON") {
                let _ = app_clone.emit("telegram-user-status", "installing_dependencies");
            } else if line.starts_with("ERROR:") {
                let _ = app_clone.emit("telegram-user-status", format!("error:{}", &line[6..]));
                break;
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn send_telegram_user_otp(code: String) -> Result<(), String> {
    let mut guard = get_login_process().lock().await;
    if let Some(stdin) = guard.as_mut() {
        let packet = format!("CODE:{}\n", code);
        let _ = stdin.write_all(packet.as_bytes()).await;
        let _ = stdin.flush().await;
        Ok(())
    } else {
        Err("No active authentication process found.".to_string())
    }
}

#[tauri::command]
pub async fn send_telegram_user_password(password: String) -> Result<(), String> {
    let mut guard = get_login_process().lock().await;
    if let Some(stdin) = guard.as_mut() {
        let packet = format!("PASSWORD:{}\n", password);
        let _ = stdin.write_all(packet.as_bytes()).await;
        let _ = stdin.flush().await;
        Ok(())
    } else {
        Err("No active authentication process found.".to_string())
    }
}

pub async fn execute_single_command(app: AppHandle, cmd: &str) -> Result<String, String> {
    let state = app.state::<AppState>();
    let (api_id, api_hash, phone, enabled) = {
        let conf = state.config.lock().unwrap();
        (conf.telegram_user.api_id.clone(), conf.telegram_user.api_hash.clone(), conf.telegram_user.phone_number.clone(), conf.telegram_user.enabled)
    };

    if !enabled {
        return Err("Telegram User account integration is disabled in settings.".to_string());
    }

    if api_id.is_empty() || api_hash.is_empty() || phone.is_empty() {
        return Err("Telegram personal account API ID, API Hash, or Phone is missing. Please set them up in settings.".to_string());
    }

    let mut child = Command::new(get_python_executable())
        .arg(get_script_path())
        .arg(&api_id)
        .arg(&api_hash)
        .arg(&phone)
        .arg(cmd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run telegram_user_agent command: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let mut reader = BufReader::new(stdout).lines();
    
    let mut result_json = String::new();
    let mut error_msg = String::new();

    while let Ok(Some(line)) = reader.next_line().await {
        let line = line.trim();
        if line.starts_with("CHATS:") {
            result_json = line[6..].to_string();
        } else if line.starts_with("MESSAGES:") {
            result_json = line[9..].to_string();
        } else if line == "SEND_SUCCESS" {
            result_json = json!({ "status": "success", "message": "Message sent successfully" }).to_string();
        } else if line.starts_with("ERROR:") {
            error_msg = line[6..].to_string();
        }
    }

    let _ = child.wait().await;

    if !error_msg.is_empty() {
        Err(error_msg)
    } else if !result_json.is_empty() {
        Ok(result_json)
    } else {
        Err("No output received from telegram_user_agent sidecar process.".to_string())
    }
}
