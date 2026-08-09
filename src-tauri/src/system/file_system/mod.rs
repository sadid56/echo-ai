use std::fs;
use std::path::Path;

pub fn list_directory(path: &str) -> Result<Vec<String>, String> {
    let p = Path::new(path);
    if !p.exists() {
        return Err(format!("Path '{}' does not exist", path));
    }
    
    let entries = fs::read_dir(p)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
        
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
    let p = Path::new(path);
    if !p.exists() {
        return Err(format!("File '{}' does not exist", path));
    }
    let content = fs::read_to_string(p).map_err(|e| format!("Failed to read file: {}", e))?;
    let numbered = content
        .lines()
        .enumerate()
        .map(|(i, line)| format!("{:>4}: {}", i + 1, line))
        .collect::<Vec<String>>()
        .join("\n");
    Ok(numbered)
}

pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    let p = Path::new(path);
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directories: {}", e))?;
    }
    fs::write(p, content).map_err(|e| format!("Failed to write file: {}", e))
}
