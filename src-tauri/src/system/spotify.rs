use std::process::Command;
use std::time::Duration;
use tauri::AppHandle;

fn extract_spotify_uri(url: &str) -> Option<String> {
    if let Some(pos) = url.find("open.spotify.com/") {
        let sub = &url[pos + 17..]; // slice after "open.spotify.com/"
        let parts: Vec<&str> = sub.split('/').collect();
        if parts.len() >= 2 {
            let media_type = parts[0]; // e.g., "track", "album", "playlist"
            let id = parts[1].split('?').next().unwrap_or(parts[1]);
            if media_type == "track" || media_type == "album" || media_type == "playlist" || media_type == "artist" {
                return Some(format!("spotify:{}:{}", media_type, id));
            }
        }
    }
    None
}

pub async fn control_spotify(app: AppHandle, action: &str, query: Option<&str>) -> Result<String, String> {
    match action {
        "open" => {
            // Check if already running using playerctl
            let check_status = Command::new("playerctl")
                .args(&["-p", "spotify", "status"])
                .output();
            
            let is_running = match check_status {
                Ok(output) => output.status.success(),
                Err(_) => false,
            };

            if is_running {
                return Ok("Spotify is already open and running.".to_string());
            }

            // Launch Spotify
            Command::new("spotify-launcher")
                .spawn()
                .map_err(|e| format!("Failed to launch Spotify: {}", e))?;

            // Give it 3 seconds to initialize
            tokio::time::sleep(Duration::from_secs(3)).await;
            Ok("Spotify launched successfully.".to_string())
        }
        "play" => {
            ensure_running().await?;
            let status = Command::new("playerctl")
                .args(&["-p", "spotify", "play"])
                .status()
                .map_err(|e| format!("Failed to send play command: {}", e))?;
            
            if status.success() {
                Ok("Playing music on Spotify.".to_string())
            } else {
                Err("Failed to execute play command via playerctl.".to_string())
            }
        }
        "pause" => {
            ensure_running().await?;
            let status = Command::new("playerctl")
                .args(&["-p", "spotify", "pause"])
                .status()
                .map_err(|e| format!("Failed to send pause command: {}", e))?;
            
            if status.success() {
                Ok("Paused music on Spotify.".to_string())
            } else {
                Err("Failed to execute pause command via playerctl.".to_string())
            }
        }
        "next" => {
            ensure_running().await?;
            let status = Command::new("playerctl")
                .args(&["-p", "spotify", "next"])
                .status()
                .map_err(|e| format!("Failed to send next command: {}", e))?;
            
            if status.success() {
                Ok("Skipped to next track on Spotify.".to_string())
            } else {
                Err("Failed to execute next command via playerctl.".to_string())
            }
        }
        "prev" => {
            ensure_running().await?;
            let status = Command::new("playerctl")
                .args(&["-p", "spotify", "previous"])
                .status()
                .map_err(|e| format!("Failed to send previous command: {}", e))?;
            
            if status.success() {
                Ok("Went to previous track on Spotify.".to_string())
            } else {
                Err("Failed to execute previous command via playerctl.".to_string())
            }
        }
        "search" => {
            let q = query.ok_or("Search query is required for search action")?;
            
            let mut play_uri = format!("spotify:search:{}", q);
            let mut direct_track_found = false;

            // Try to search DuckDuckGo for the track URI on spotify.com
            let search_query = format!("\"{}\" spotify track site:open.spotify.com", q);
            if let Ok(json_res) = crate::sidecar::process_manager::run_ddg_search(app.clone(), &search_query).await {
                if let Ok(results) = serde_json::from_str::<Vec<serde_json::Value>>(&json_res) {
                    for item in results {
                        if let Some(link) = item.get("link").and_then(|v| v.as_str()) {
                            if let Some(uri) = extract_spotify_uri(link) {
                                play_uri = uri;
                                direct_track_found = true;
                                break;
                            }
                        }
                    }
                }
            }

            ensure_running().await?;

            let status = Command::new("playerctl")
                .args(&["-p", "spotify", "open", &play_uri])
                .status()
                .map_err(|e| format!("Failed to open track on Spotify: {}", e))?;

            if status.success() {
                if direct_track_found {
                    Ok(format!("Directly playing '{}' on Spotify.", q))
                } else {
                    Ok(format!("Opened Spotify search for '{}'.", q))
                }
            } else {
                Command::new("spotify-launcher")
                    .arg(&play_uri)
                    .spawn()
                    .map_err(|e| format!("Failed to search on Spotify: {}", e))?;
                Ok(format!("Opened Spotify search for '{}' (fallback).", q))
            }
        }
        _ => Err(format!("Unknown Spotify action: {}", action)),
    }
}

async fn ensure_running() -> Result<(), String> {
    let check_status = Command::new("playerctl")
        .args(&["-p", "spotify", "status"])
        .output();
    
    let is_running = match check_status {
        Ok(output) => output.status.success(),
        Err(_) => false,
    };

    if !is_running {
        Command::new("spotify-launcher")
            .spawn()
            .map_err(|e| format!("Failed to start Spotify: {}", e))?;
        tokio::time::sleep(Duration::from_secs(4)).await;
    }
    Ok(())
}
