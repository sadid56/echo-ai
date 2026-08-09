use std::path::PathBuf;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use std::process::Stdio;
use tauri::{AppHandle, Emitter};

pub async fn run_python_agent(
    app: AppHandle,
    url: &str,
    query: &str,
    steps: &str,
) -> Result<String, String> {
    // Find the python sidecar script path
    let mut script_path = PathBuf::from(".");
    script_path.push("sidecars");
    script_path.push("browser_agent");
    script_path.push("main.py");
    
    // Fallback search if current dir is src-tauri
    if !script_path.exists() {
        script_path = PathBuf::from("..");
        script_path.push("sidecars");
        script_path.push("browser_agent");
        script_path.push("main.py");
    }

    if !script_path.exists() {
        // Fallback to absolute workspace path
        script_path = PathBuf::from("/Users/sadid/Works/projects/echo-ai/sidecars/browser_agent/main.py");
    }

    let script_str = script_path.to_string_lossy().to_string();
    
    let mut cmd = Command::new("python3");
    cmd.arg(&script_str);
    
    if !steps.is_empty() {
        cmd.arg("--steps").arg(steps);
    }
    if !url.is_empty() {
        cmd.arg("--url").arg(url);
    }
    if !query.is_empty() {
        cmd.arg("--query").arg(query);
    }

    let mut child = cmd
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Python sidecar: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to open stdout pipe")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr pipe")?;
    
    let mut reader = BufReader::new(stdout).lines();
    let mut err_reader = BufReader::new(stderr).lines();
    
    let app_clone = app.clone();
    
    // Spawn task to read stderr logs
    tokio::spawn(async move {
        while let Ok(Some(line)) = err_reader.next_line().await {
            let log_msg = format!("[Python Err] {}", line);
            let _ = app_clone.emit("sidecar-log", log_msg);
        }
    });

    let mut final_output = String::new();
    let mut last_json = String::new();

    // Read stdout line-by-line in real-time
    while let Ok(Some(line)) = reader.next_line().await {
        // Stream the raw log line to frontend for terminal visibility
        let log_msg = format!("[Python] {}", line);
        let _ = app.emit("sidecar-log", log_msg);

        // Keep track of the full stdout
        final_output.push_str(&line);
        final_output.push('\n');

        // Check if the line is a JSON result (often at the end)
        if line.trim().starts_with('{') && line.trim().ends_with('}') {
            last_json = line.clone();
            return Ok(last_json);
        }
    }

    let status = child.wait().await.map_err(|e| format!("Failed to wait on child: {}", e))?;
    
    if status.success() {
        if !last_json.is_empty() {
            Ok(last_json)
        } else {
            Ok(final_output)
        }
    } else {
        Err(format!("Python process exited with failure status: {:?}", status.code()))
    }
}

pub async fn run_email_agent(
    app: AppHandle,
    server: &str,
    email_address: &str,
    password: &str,
    filter_type: &str,
) -> Result<String, String> {
    let mut script_path = PathBuf::from(".");
    script_path.push("sidecars");
    script_path.push("email_agent");
    script_path.push("fetch_emails.py");
    
    if !script_path.exists() {
        script_path = PathBuf::from("..");
        script_path.push("sidecars");
        script_path.push("email_agent");
        script_path.push("fetch_emails.py");
    }

    if !script_path.exists() {
        script_path = PathBuf::from("/Users/sadid/Works/projects/echo-ai/sidecars/email_agent/fetch_emails.py");
    }

    let script_str = script_path.to_string_lossy().to_string();
    
    let mut child = Command::new("python3")
        .arg(&script_str)
        .arg("--server")
        .arg(server)
        .arg("--email")
        .arg(email_address)
        .arg("--password")
        .arg(password)
        .arg("--filter")
        .arg(filter_type)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Python email sidecar: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to open stdout pipe")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr pipe")?;
    
    let mut reader = BufReader::new(stdout).lines();
    let mut err_reader = BufReader::new(stderr).lines();
    
    let app_clone = app.clone();
    tokio::spawn(async move {
        while let Ok(Some(line)) = err_reader.next_line().await {
            let log_msg = format!("[Python Email Err] {}", line);
            let _ = app_clone.emit("sidecar-log", log_msg);
        }
    });

    let mut final_output = String::new();
    let mut last_json = String::new();

    while let Ok(Some(line)) = reader.next_line().await {
        let log_msg = format!("[Python Email] {}", line);
        let _ = app.emit("sidecar-log", log_msg);

        final_output.push_str(&line);
        final_output.push('\n');

        if line.trim().starts_with('{') && line.trim().ends_with('}') {
            last_json = line.clone();
        }
    }

    let status = child.wait().await.map_err(|e| format!("Failed to wait on child: {}", e))?;
    
    if status.success() {
        if !last_json.is_empty() {
            Ok(last_json)
        } else {
            Ok(final_output)
        }
    } else {
        Err(format!("Python email process exited with failure status: {:?}", status.code()))
    }
}

