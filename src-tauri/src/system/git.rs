use tokio::process::Command;

pub async fn run_git_action(
    action: &str,
    commit_message: Option<&str>,
    target: Option<&str>
) -> Result<String, String> {
    match action {
        "status" => {
            let output = Command::new("git")
                .arg("status")
                .output()
                .await
                .map_err(|e| format!("Failed to execute git status: {}", e))?;
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        }
        "diff" => {
            let output = Command::new("git")
                .arg("diff")
                .output()
                .await
                .map_err(|e| format!("Failed to execute git diff: {}", e))?;
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        }
        "commit_and_push" => {
            // Stage changes
            let add_output = Command::new("git")
                .args(&["add", "."])
                .output()
                .await
                .map_err(|e| format!("Failed to execute git add: {}", e))?;
            if !add_output.status.success() {
                return Err(format!("git add failed: {}", String::from_utf8_lossy(&add_output.stderr)));
            }

            // Commit changes
            let msg = commit_message.unwrap_or("Automated commit by Echo AI");
            let commit_output = Command::new("git")
                .args(&["commit", "-m", msg])
                .output()
                .await
                .map_err(|e| format!("Failed to execute git commit: {}", e))?;
            if !commit_output.status.success() {
                return Err(format!("git commit failed: {}", String::from_utf8_lossy(&commit_output.stderr)));
            }

            // Push changes
            let push_output = Command::new("git")
                .arg("push")
                .output()
                .await
                .map_err(|e| format!("Failed to execute git push: {}", e))?;
            if !push_output.status.success() {
                return Err(format!("git push failed: {}", String::from_utf8_lossy(&push_output.stderr)));
            }

            Ok("Successfully staged, committed, and pushed all modifications.".to_string())
        }
        "rebase" => {
            let branch = target.ok_or_else(|| "Missing 'target' branch argument for rebase".to_string())?;
            let output = Command::new("git")
                .args(&["rebase", branch])
                .output()
                .await
                .map_err(|e| format!("Failed to execute git rebase: {}", e))?;
            
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            
            if output.status.success() {
                Ok(format!("Successfully rebased: {}", stdout))
            } else {
                Err(format!("Git rebase failed. You may have conflicts.\nSTDOUT:\n{}\nSTDERR:\n{}", stdout, stderr))
            }
        }
        "rebase_continue" => {
            // Rebase continue requires GIT_EDITOR=true to auto-accept messages if any editor pops up, or --no-edit
            let output = Command::new("git")
                .env("GIT_EDITOR", "true")
                .args(&["rebase", "--continue"])
                .output()
                .await
                .map_err(|e| format!("Failed to execute git rebase --continue: {}", e))?;
            
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            
            if output.status.success() {
                Ok(format!("Successfully continued rebase:\n{}", stdout))
            } else {
                Err(format!("Rebase continue failed. Ensure all conflicts are resolved and staged.\nSTDOUT:\n{}\nSTDERR:\n{}", stdout, stderr))
            }
        }
        "rebase_abort" => {
            let output = Command::new("git")
                .args(&["rebase", "--abort"])
                .output()
                .await
                .map_err(|e| format!("Failed to execute git rebase --abort: {}", e))?;
            
            if output.status.success() {
                Ok("Successfully aborted active rebase.".to_string())
            } else {
                Err(format!("Failed to abort rebase: {}", String::from_utf8_lossy(&output.stderr)))
            }
        }
        _ => Err(format!("Unsupported git action: {}", action))
    }
}
