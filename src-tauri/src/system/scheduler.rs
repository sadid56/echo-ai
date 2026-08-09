use serde::{Deserialize, Serialize};
use std::fs;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use crate::ai::orchestrator::{AppState, Orchestrator};
use chrono::{Datelike, Timelike};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ScheduledTask {
    name: String,
    hour: u32,
    minute: u32,
    prompt: String,
}

pub fn start_scheduler(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last_run_day = 0;
        let mut last_run_hour = 99;
        
        loop {
            tokio::time::sleep(Duration::from_secs(30)).await;
            
            let now = chrono::Local::now();
            let current_day = now.date_naive().day();
            let current_hour = now.hour();
            let current_minute = now.minute();
            
            if current_hour == last_run_hour && current_day == last_run_day {
                continue;
            }
            
            let config_path = std::env::current_dir()
                .unwrap_or_default()
                .join("schedule.json");
                
            if !config_path.exists() {
                let default_schedule = vec![
                    ScheduledTask {
                        name: "Morning briefing".to_string(),
                        hour: 9,
                        minute: 0,
                        prompt: "Check for unread emails and summarize them.".to_string(),
                    }
                ];
                let _ = fs::write(&config_path, serde_json::to_string_pretty(&default_schedule).unwrap_or_default());
            }
            
            if let Ok(content) = fs::read_to_string(&config_path) {
                if let Ok(tasks) = serde_json::from_str::<Vec<ScheduledTask>>(&content) {
                    for task in tasks {
                        if task.hour == current_hour && task.minute == current_minute {
                            last_run_day = current_day;
                            last_run_hour = current_hour;
                            
                            let _ = app.emit("sidecar-log", format!("[Scheduler] Triggering scheduled task: {}", task.name));
                            
                            let app_clone = app.clone();
                            tauri::async_runtime::spawn(async move {
                                if let Some(state) = app_clone.try_state::<AppState>() {
                                    match Orchestrator::process_prompt(app_clone.clone(), &state, &task.prompt).await {
                                        Ok(res) => {
                                            let _ = app_clone.emit("sidecar-log", format!("[Scheduler Success] Completed routine for {}. Output length: {}", task.name, res.len()));
                                        }
                                        Err(err) => {
                                            let _ = app_clone.emit("sidecar-log", format!("[Scheduler Err] Routine failed: {}", err));
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            }
        }
    });
}
