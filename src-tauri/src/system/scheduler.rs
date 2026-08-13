use std::time::Duration;
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, Manager};
use crate::ai::orchestrator::{AppState, Orchestrator};
use chrono::{Datelike, Timelike};

pub fn start_scheduler(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        // Keep track of the last run timestamps for each task dynamically
        let mut last_run_times: HashMap<String, i64> = HashMap::new();
        
        loop {
            tokio::time::sleep(Duration::from_secs(10)).await;
            
            let now = chrono::Local::now();
            let now_ts = now.timestamp();
            
            // Fetch dynamically configured scheduled tasks from synced AppConfig state
            let tasks = if let Some(state) = app.try_state::<AppState>() {
                let conf = state.config.lock().unwrap();
                conf.schedule.clone()
            } else {
                Vec::new()
            };
            
            for task in tasks {
                let should_trigger = match task.frequency.as_str() {
                    "daily" => {
                        let target_hour = task.hour.unwrap_or(0);
                        let target_minute = task.minute.unwrap_or(0);
                        
                        if now.hour() == target_hour && now.minute() == target_minute {
                            let last_run = last_run_times.get(&task.name).cloned().unwrap_or(0);
                            let today_start = now.date_naive()
                                .and_hms_opt(0, 0, 0)
                                .unwrap()
                                .and_local_timezone(chrono::Local)
                                .unwrap()
                                .timestamp();
                            // Only trigger if it hasn't run yet today
                            last_run < today_start
                        } else {
                            false
                        }
                    }
                    "weekly" => {
                        let target_weekday = task.day_of_week.unwrap_or(1); // 1 = Monday, 7 = Sunday
                        let target_hour = task.hour.unwrap_or(0);
                        let target_minute = task.minute.unwrap_or(0);
                        
                        let current_weekday = now.weekday().number_from_monday();
                        if current_weekday == target_weekday && now.hour() == target_hour && now.minute() == target_minute {
                            let last_run = last_run_times.get(&task.name).cloned().unwrap_or(0);
                            let today_start = now.date_naive()
                                .and_hms_opt(0, 0, 0)
                                .unwrap()
                                .and_local_timezone(chrono::Local)
                                .unwrap()
                                .timestamp();
                            // Only trigger if it hasn't run yet today
                            last_run < today_start
                        } else {
                            false
                        }
                    }
                    "monthly" => {
                        let target_day = task.day_of_month.unwrap_or(1);
                        let target_hour = task.hour.unwrap_or(0);
                        let target_minute = task.minute.unwrap_or(0);
                        
                        let current_day = now.day();
                        if current_day == target_day && now.hour() == target_hour && now.minute() == target_minute {
                            let last_run = last_run_times.get(&task.name).cloned().unwrap_or(0);
                            let today_start = now.date_naive()
                                .and_hms_opt(0, 0, 0)
                                .unwrap()
                                .and_local_timezone(chrono::Local)
                                .unwrap()
                                .timestamp();
                            // Only trigger if it hasn't run yet today
                            last_run < today_start
                        } else {
                            false
                        }
                    }
                    "interval" => {
                        let interval_secs = (task.interval_minutes.unwrap_or(1) * 60) as i64;
                        let last_run = last_run_times.get(&task.name).cloned().unwrap_or(0);
                        // Trigger if interval elapsed
                        now_ts - last_run >= interval_secs
                    }
                    _ => false,
                };
                
                if should_trigger {
                    last_run_times.insert(task.name.clone(), now_ts);
                    let _ = app.emit("sidecar-log", format!("[Scheduler] Triggering scheduled task: {}", task.name));
                    
                    let app_clone = app.clone();
                    let prompt = task.prompt.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Some(state) = app_clone.try_state::<AppState>() {
                            match Orchestrator::process_prompt(app_clone.clone(), &state, &prompt).await {
                                Ok(res) => {
                                    let _ = app_clone.emit("sidecar-log", format!("[Scheduler Success] Completed routine for '{}'. Output length: {}", task.name, res.len()));
                                }
                                Err(err) => {
                                    let _ = app_clone.emit("sidecar-log", format!("[Scheduler Err] Routine failed for '{}': {}", task.name, err));
                                }
                            }
                        }
                    });
                }
            }
        }
    });
}
