use std::path::PathBuf;

#[cfg(target_os = "macos")]
pub fn set_autostart(enable: bool) -> Result<(), String> {
    use std::fs;
    let home_dir = std::env::var("HOME")
        .map(PathBuf::from)
        .map_err(|_| "Failed to resolve HOME directory".to_string())?;
        
    let plist_dir = home_dir.join("Library").join("LaunchAgents");
    let plist_path = plist_dir.join("com.echo-ai.startup.plist");
    
    if enable {
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get current executable path: {}", e))?;
            
        let plist_content = format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.echo-ai.startup</string>
    <key>ProgramArguments</key>
    <array>
        <string>{}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>"#,
            exe_path.to_string_lossy()
        );
        
        fs::create_dir_all(&plist_dir)
            .map_err(|e| format!("Failed to create LaunchAgents directory: {}", e))?;
            
        fs::write(&plist_path, plist_content)
            .map_err(|e| format!("Failed to write plist file: {}", e))?;
    } else {
        if plist_path.exists() {
            fs::remove_file(&plist_path)
                .map_err(|e| format!("Failed to remove plist file: {}", e))?;
        }
    }
    Ok(())
}

#[cfg(target_os = "linux")]
pub fn set_autostart(enable: bool) -> Result<(), String> {
    use std::fs;
    let home_dir = std::env::var("HOME")
        .map(PathBuf::from)
        .map_err(|_| "Failed to resolve HOME directory".to_string())?;
        
    let autostart_dir = home_dir.join(".config").join("autostart");
    let desktop_path = autostart_dir.join("echo-ai.desktop");
    
    if enable {
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get current executable path: {}", e))?;
            
        let desktop_content = format!(
            r#"[Desktop Entry]
Type=Application
Name=Echo AI
Comment=Autonomous Enterprise AI Assistant
Exec={}
Terminal=false
X-GNOME-Autostart-enabled=true
"#,
            exe_path.to_string_lossy()
        );
        
        fs::create_dir_all(&autostart_dir)
            .map_err(|e| format!("Failed to create autostart directory: {}", e))?;
            
        fs::write(&desktop_path, desktop_content)
            .map_err(|e| format!("Failed to write desktop file: {}", e))?;
    } else {
        if desktop_path.exists() {
            fs::remove_file(&desktop_path)
                .map_err(|e| format!("Failed to remove desktop file: {}", e))?;
        }
    }
    Ok(())
}

#[cfg(target_os = "windows")]
pub fn set_autostart(enable: bool) -> Result<(), String> {
    use std::process::Command;
    
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get current executable path: {}", e))?;
        
    let exe_str = exe_path.to_string_lossy();
    
    if enable {
        let status = Command::new("reg")
            .args(&[
                "add",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                "/v",
                "Echo AI",
                "/t",
                "REG_SZ",
                "/d",
                &exe_str,
                "/f"
            ])
            .status()
            .map_err(|e| format!("Failed to run reg add command: {}", e))?;
            
        if !status.success() {
            return Err("reg add command exited with error status".to_string());
        }
    } else {
        let _ = Command::new("reg")
            .args(&[
                "delete",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                "/v",
                "Echo AI",
                "/f"
            ])
            .status();
    }
    Ok(())
}

#[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
pub fn set_autostart(_enable: bool) -> Result<(), String> {
    Ok(())
}
