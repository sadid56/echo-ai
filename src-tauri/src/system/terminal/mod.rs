use tokio::process::Command;

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
        
    let stdout = String::from_utf8_lossy(&output.stdout).into_owned();
    let stderr = String::from_utf8_lossy(&output.stderr).into_owned();
    
    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("Exit Code: {:?}\nSTDOUT:\n{}\nSTDERR:\n{}", output.status.code(), stdout, stderr))
    }
}
