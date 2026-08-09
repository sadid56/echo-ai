use notify_rust::Notification;
use tokio::process::Command;

pub fn send_notification(title: &str, body: &str) -> Result<(), String> {
    Notification::new()
        .summary(title)
        .body(body)
        .icon("dialog-information")
        .show()
        .map(|_| ())
        .map_err(|e| format!("Failed to send desktop notification: {}", e))
}

pub async fn get_active_notifications() -> Result<String, String> {
    // Try standard freedesktop notifications DBus call via gdbus
    let output = Command::new("gdbus")
        .args(&[
            "call",
            "--session",
            "--dest",
            "org.freedesktop.Notifications",
            "--object-path",
            "/org/freedesktop/Notifications",
            "--method",
            "org.freedesktop.Notifications.GetActiveNotifications"
        ])
        .output()
        .await;

    match output {
        Ok(out) if out.status.success() => {
            Ok(String::from_utf8_lossy(&out.stdout).to_string())
        }
        _ => {
            // Fallback: try qdbus (standard on KDE Plasma)
            let q_output = Command::new("qdbus")
                .args(&[
                    "org.freedesktop.Notifications",
                    "/org/freedesktop/Notifications",
                    "org.freedesktop.Notifications.GetActiveNotifications"
                ])
                .output()
                .await;

            match q_output {
                Ok(out) if out.status.success() => {
                    Ok(String::from_utf8_lossy(&out.stdout).to_string())
                }
                _ => {
                    // Try another common KDE visual notifications DBus path
                    let kde_output = Command::new("qdbus")
                        .args(&[
                            "org.kde.VisualNotifications",
                            "/VisualNotifications",
                            "org.kde.VisualNotifications.GetActiveNotifications"
                        ])
                        .output()
                        .await;

                    match kde_output {
                        Ok(out) if out.status.success() => {
                            Ok(String::from_utf8_lossy(&out.stdout).to_string())
                        }
                        _ => {
                            Err("Active desktop notification querying is not supported on KDE Plasma. The standard Freedesktop notification daemon specification only supports sending notifications, not listing active history.".to_string())
                        }
                    }
                }
            }
        }
    }
}
