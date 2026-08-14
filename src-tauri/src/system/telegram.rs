use std::time::Duration;
use tauri::{AppHandle, Manager, Emitter};
use crate::ai::orchestrator::{AppState, Orchestrator};
use serde::Deserialize;
use reqwest::Client;

#[derive(Debug, Deserialize)]
struct TelegramResponse {
    result: Vec<TelegramUpdate>,
}

#[derive(Debug, Deserialize)]
struct TelegramUpdate {
    update_id: i64,
    message: Option<TelegramMessage>,
}

#[derive(Debug, Deserialize)]
struct TelegramMessage {
    chat: TelegramChat,
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TelegramChat {
    id: i64,
    username: Option<String>,
}

pub fn start_telegram_listener(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let client = Client::new();
        let mut last_update_id = 0i64;

        loop {
            tokio::time::sleep(Duration::from_secs(3)).await;

            let (token, target_chat_id, enabled) = if let Some(state) = app.try_state::<AppState>() {
                let conf = state.config.lock().unwrap();
                (conf.telegram.token.clone(), conf.telegram.chat_id.clone(), conf.telegram.enabled)
            } else {
                (String::new(), String::new(), false)
            };

            if !enabled || token.is_empty() {
                continue;
            }

            let url = format!("https://api.telegram.org/bot{}/getUpdates", token);
            let mut query = vec![("timeout", "5".to_string())];
            if last_update_id > 0 {
                query.push(("offset", (last_update_id + 1).to_string()));
            }

            let response = match client.get(&url).query(&query).send().await {
                Ok(resp) => resp,
                Err(e) => {
                    let _ = app.emit("sidecar-log", format!("[Telegram Network Err] Failed to request updates: {}", e));
                    continue;
                }
            };

            let status = response.status();
            let body_text = response.text().await.unwrap_or_default();

            if !status.is_success() {
                let _ = app.emit("sidecar-log", format!("[Telegram API Err] Status {}: {}", status, body_text));
                continue;
            }

            let updates: TelegramResponse = match serde_json::from_str(&body_text) {
                Ok(data) => data,
                Err(e) => {
                    // Only log if it's not an empty body or unrelated response
                    let _ = app.emit("sidecar-log", format!("[Telegram Parse Err] Failed to parse updates: {} | Body: {}", e, body_text));
                    continue;
                }
            };

            for update in updates.result {
                last_update_id = update.update_id;

                if let Some(msg) = update.message {
                    let chat_id_str = msg.chat.id.to_string();
                    let chat_username = msg.chat.username.clone().unwrap_or_default();

                    let is_authorized = chat_id_str == target_chat_id 
                        || (!target_chat_id.is_empty() && chat_username.to_lowercase() == target_chat_id.trim_start_matches('@').to_lowercase());

                    if !is_authorized {
                        continue;
                    }

                    if let Some(text) = msg.text {
                        let app_clone = app.clone();
                        let chat_id = msg.chat.id;
                        let token_clone = token.clone();
                        let client_clone = client.clone();
                        
                        let _ = app_clone.emit("sidecar-log", format!("[Telegram Bot] Received prompt: {}", text));

                        tauri::async_runtime::spawn(async move {
                            if let Some(state) = app_clone.try_state::<AppState>() {
                                match Orchestrator::process_prompt(app_clone.clone(), &state, &text, None).await {
                                    Ok(res) => {
                                        let reply_url = format!("https://api.telegram.org/bot{}/sendMessage", token_clone);
                                        let _ = client_clone.post(&reply_url)
                                            .json(&serde_json::json!({
                                                "chat_id": chat_id,
                                                "text": res.content,
                                            }))
                                            .send()
                                            .await;
                                    }
                                    Err(err) => {
                                        let reply_url = format!("https://api.telegram.org/bot{}/sendMessage", token_clone);
                                        let _ = client_clone.post(&reply_url)
                                            .json(&serde_json::json!({
                                                "chat_id": chat_id,
                                                "text": format!("❌ Error: {}", err)
                                            }))
                                            .send()
                                            .await;
                                    }
                                }
                            }
                        });
                    }
                }
            }
        }
    });
}

pub async fn send_telegram(token: &str, chat_id: &str, message: &str) -> Result<String, String> {
    if token.is_empty() || chat_id.is_empty() {
        return Err("Telegram Token or Chat ID is not configured. Please set them up in settings.".to_string());
    }

    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to initialize HTTP client: {}", e))?;

    let url = format!("https://api.telegram.org/bot{}/sendMessage", token);
    
    // Resolve chat_id if username was provided (usernames must start with @)
    let chat_id_param = if chat_id.starts_with('@') || chat_id.chars().all(|c| c.is_numeric() || c == '-') {
        chat_id.to_string()
    } else {
        format!("@{}", chat_id)
    };

    let response = client
        .post(&url)
        .json(&serde_json::json!({
            "chat_id": chat_id_param,
            "text": message,
        }))
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    let status = response.status();
    let body = response.text().await.unwrap_or_else(|_| "".to_string());

    if status.is_success() {
        Ok(format!("Telegram message sent successfully: {}", body))
    } else {
        Err(format!(
            "Failed to send Telegram message. Server returned status {}: {}",
            status, body
        ))
    }
}
