use std::fs;
use std::path::PathBuf;

fn expand_path(path_str: &str) -> PathBuf {
    if path_str == "~" {
        if let Ok(home) = std::env::var("HOME").or_else(|_| std::env::var("USERPROFILE")) {
            return PathBuf::from(home);
        }
    } else if path_str.starts_with("~/") {
        if let Ok(home) = std::env::var("HOME").or_else(|_| std::env::var("USERPROFILE")) {
            return PathBuf::from(home).join(&path_str[2..]);
        }
    }
    PathBuf::from(path_str)
}

pub fn list_directory(path: &str) -> Result<Vec<String>, String> {
    let p = expand_path(path);
    if !p.exists() {
        return Err(format!("Path '{}' does not exist", p.display()));
    }
    
    let entries = fs::read_dir(&p)
        .map_err(|e| format!("Failed to read directory '{}': {}", p.display(), e))?;
        
    let mut files = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            let file_name = entry.file_name().to_string_lossy().into_owned();
            let file_type = if entry.path().is_dir() { "Dir" } else { "File" };
            files.push(format!("[{}] {}", file_type, file_name));
        }
        if files.len() >= 60 {
            files.push("[Alert] ... Remaining items truncated due to directory size limit.".to_string());
            break;
        }
    }
    Ok(files)
}

pub fn read_file(path: &str) -> Result<String, String> {
    let p = expand_path(path);
    if !p.exists() {
        return Err(format!("File '{}' does not exist", p.display()));
    }
    let content = fs::read_to_string(&p).map_err(|e| format!("Failed to read file '{}': {}", p.display(), e))?;
    let numbered = content
        .lines()
        .enumerate()
        .map(|(i, line)| format!("{:>4}: {}", i + 1, line))
        .collect::<Vec<String>>()
        .join("\n");
    Ok(numbered)
}

pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    let p = expand_path(path);
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directories for '{}': {}", p.display(), e))?;
    }
    fs::write(&p, content).map_err(|e| format!("Failed to write file '{}': {}", p.display(), e))
}
