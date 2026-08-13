use std::time::Duration;
use arboard::Clipboard;
use tauri::{AppHandle, Emitter, Manager};
use crate::ai::orchestrator::{AppState, Orchestrator};
use crate::system::notification;

pub fn start_clipboard_helper(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last_clipboard_content = String::new();
        
        loop {
            tokio::time::sleep(Duration::from_millis(1500)).await;
            
            // Check if enabled in settings config
            let enabled = if let Some(state) = app.try_state::<AppState>() {
                let conf = state.config.lock().unwrap();
                conf.enable_clipboard_helper
            } else {
                false
            };
            
            if !enabled {
                continue;
            }
            
            // Try to read clipboard text
            let mut current_content = String::new();
            if let Ok(mut ctx) = Clipboard::new() {
                if let Ok(text) = ctx.get_text() {
                    current_content = text.trim().to_string();
                }
            }
            
            if current_content.is_empty() || current_content == last_clipboard_content {
                continue;
            }
            
            // Update tracking to avoid looping on the same copy
            last_clipboard_content = current_content.clone();
            
            // Detect if content looks like a stack trace, compiler error, or crash log
            let is_error = detect_error_pattern(&current_content);
            if is_error {
                let _ = app.emit("sidecar-log", "[Clipboard Helper] Detected error/crash pattern in clipboard. Processing automatically...");
                let _ = notification::send_notification(
                    "Error Detected 🔍",
                    "Analyzing clipboard error and generating fix..."
                );
                
                let app_clone = app.clone();
                let prompt = format!(
                    "I copied this error to my clipboard: '{}'\n\nPlease briefly explain the cause of this error and provide the corrected code or fix. Copy the corrected code or the final solution block back to my clipboard so I can paste it directly. Return the explanation and solution to me.",
                    current_content
                );
                
                tauri::async_runtime::spawn(async move {
                    if let Some(state) = app_clone.try_state::<AppState>() {
                        match Orchestrator::process_prompt(app_clone.clone(), &state, &prompt).await {
                            Ok(res) => {
                                // Extract code blocks or just copy response back
                                let clean_solution = extract_code_or_full_text(&res);
                                if let Ok(mut ctx) = Clipboard::new() {
                                    let _ = ctx.set_text(clean_solution);
                                    let _ = app_clone.emit("sidecar-log", "[Clipboard Helper] Solution successfully copied back to clipboard.");
                                    let _ = notification::send_notification(
                                        "Solution Copied! ✅",
                                        "The fix has been written to your clipboard."
                                    );
                                }
                            }
                            Err(err) => {
                                let _ = app_clone.emit("sidecar-log", format!("[Clipboard Helper Err] Failed to process error: {}", err));
                            }
                        }
                    }
                });
            }
        }
    });
}

fn detect_error_pattern(text: &str) -> bool {
    let lowercase = text.to_lowercase();
    
    // Check keywords common in error outputs, exceptions, and stacktraces
    let keywords = [
        "exception",
        "stacktrace",
        "stack trace",
        "typeerror",
        "referenceerror",
        "syntaxerror",
        "compilation failed",
        "rustc --explain",
        "traceback (most recent call last):",
        "fatal error",
        "nullpointerexception",
        "undescribed error",
        "panic at",
        "uncaught error",
        "failed to compile",
        "thread 'main' panicked at",
    ];
    
    for kw in &keywords {
        if lowercase.contains(kw) {
            return true;
        }
    }
    
    // Also check standard exception formats or lines with "Error: ..." accompanied by double lines
    if lowercase.contains("error:") && lowercase.contains('\n') {
        return true;
    }
    
    false
}

fn extract_code_or_full_text(text: &str) -> String {
    if let Some(start_idx) = text.find("```") {
        let after_ticks = &text[start_idx + 3..];
        let content_start = if let Some(first_newline) = after_ticks.find('\n') {
            &after_ticks[first_newline + 1..]
        } else {
            after_ticks
        };
        
        if let Some(end_idx) = content_start.find("```") {
            return content_start[..end_idx].trim().to_string();
        }
    }
    
    text.to_string()
}
