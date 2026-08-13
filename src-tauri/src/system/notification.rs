use std::process::Command;

pub fn send_notification(title: &str, body: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let escaped_title = title.replace('\\', "\\\\").replace('"', "\\\"");
        let escaped_body = body.replace('\\', "\\\\").replace('"', "\\\"");
        let script = format!(
            r#"display notification "{}" with title "{}""#,
            escaped_body, escaped_title
        );
        let status = Command::new("osascript")
            .args(&["-e", &script])
            .status();
            
        match status {
            Ok(s) if s.success() => return Ok(()),
            _ => {} 
        }
    }

    #[cfg(target_os = "linux")]
    {
        let status = Command::new("notify-send")
            .args(&[title, body])
            .status();
            
        match status {
            Ok(s) if s.success() => return Ok(()),
            _ => {} 
        }
    }

    notify_rust::Notification::new()
        .summary(title)
        .body(body)
        .icon("dialog-information")
        .show()
        .map(|_| ())
        .map_err(|e| format!("Failed to send desktop notification: {}", e))
}
