use tokio::process::Command;

fn truncate_string(s: &str, max_len: usize) -> String {
    if s.len() > max_len {
        let mut truncated = s.chars().take(max_len).collect::<String>();
        truncated.push_str("\n\n...[Remaining output truncated due to length limit]...");
        truncated
    } else {
        s.to_string()
    }
}

pub async fn execute_command(command: &str) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    let mut cmd = Command::new("cmd");
    #[cfg(target_os = "windows")]
    cmd.args(&["/C", command]);

    #[cfg(not(target_os = "windows"))]
    let mut cmd = Command::new("sh");
    #[cfg(not(target_os = "windows"))]
    cmd.args(&["-c", command]);

    let output = cmd.output()
        .await
        .map_err(|e| format!("Failed to run command process: {}", e))?;
        
    let raw_stdout = String::from_utf8_lossy(&output.stdout);
    let raw_stderr = String::from_utf8_lossy(&output.stderr);
    
    let stdout = truncate_string(&raw_stdout, 1500);
    let stderr = truncate_string(&raw_stderr, 1000);
    
    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("Exit Code: {:?}\nSTDOUT:\n{}\nSTDERR:\n{}", output.status.code(), stdout, stderr))
    }
}
