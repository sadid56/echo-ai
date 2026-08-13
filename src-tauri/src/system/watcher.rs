use notify::{Watcher, RecursiveMode, Result, Event};
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use crate::ai::orchestrator::AppState;

pub fn start_file_watcher(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let (tx, mut rx) = tokio::sync::mpsc::channel(100);
        let tx = Arc::new(Mutex::new(tx));
        
        let tx_clone = Arc::clone(&tx);
        let mut watcher = notify::recommended_watcher(move |res: Result<Event>| {
            if let Ok(event) = res {
                if event.kind.is_modify() {
                    let tx_g = tx_clone.blocking_lock();
                    let _ = tx_g.blocking_send(event);
                }
            }
        });

        if let Ok(ref mut w) = watcher {
            let path = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
            let _ = w.watch(&path, RecursiveMode::Recursive);
            
            let _w_holder = watcher;
            let mut last_trigger = std::time::Instant::now() - std::time::Duration::from_secs(10);

            while let Some(event) = rx.recv().await {
                let enabled = if let Some(state) = app.try_state::<AppState>() {
                    let conf = state.config.lock().unwrap();
                    conf.enable_file_watcher
                } else {
                    false
                };
                
                if !enabled {
                    continue;
                }

                if last_trigger.elapsed() < std::time::Duration::from_millis(2000) {
                    continue;
                }
                
                let mut should_check = false;
                for path in &event.paths {
                    if let Some(ext) = path.extension() {
                        let ext_str = ext.to_string_lossy();
                        if ext_str == "rs" || ext_str == "ts" || ext_str == "tsx" || ext_str == "py" {
                            should_check = true;
                            break;
                        }
                    }
                }
                
                if should_check {
                    last_trigger = std::time::Instant::now();
                    let app_c = app.clone();
                    let _ = app_c.emit("sidecar-log", "[Watcher] Code file change detected. Triggering build test check...".to_string());
                    
                    tauri::async_runtime::spawn(async move {
                        let cur_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
                        let check_path = if cur_dir.join("src-tauri").exists() {
                            cur_dir.join("src-tauri")
                        } else {
                            cur_dir.clone()
                        };
                        
                        let is_rust = check_path.join("Cargo.toml").exists();
                        let output = if is_rust {
                            tokio::process::Command::new("cargo")
                                .arg("check")
                                .current_dir(&check_path)
                                .output()
                                .await
                        } else {
                            tokio::process::Command::new("npm")
                                .args(&["run", "build"])
                                .current_dir(&cur_dir)
                                .output()
                                .await
                        };
                        
                        match output {
                            Ok(out) => {
                                if !out.status.success() {
                                    let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                                    let clean_err = stderr.lines().take(8).collect::<Vec<&str>>().join("\n");
                                    let _ = app_c.emit(
                                        "sidecar-log",
                                        format!("[Watcher Err] Code fails compilation:\n{}\n\nHint: Ask me to fix this build error.", clean_err)
                                    );
                                } else {
                                    let _ = app_c.emit("sidecar-log", "[Watcher Success] Code compiles cleanly!".to_string());
                                }
                            }
                            Err(e) => {
                                let _ = app_c.emit("sidecar-log", format!("[Watcher Alert] Build runner failed: {}", e));
                            }
                        }
                    });
                }
            }
        }
    });
}
