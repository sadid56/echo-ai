#[cfg(not(target_os = "android"))]
use arboard::Clipboard;

pub fn read_clipboard() -> Result<String, String> {
    #[cfg(not(target_os = "android"))]
    {
        let mut clipboard = Clipboard::new().map_err(|e| format!("Failed to initialize clipboard: {}", e))?;
        clipboard.get_text().map_err(|e| format!("Failed to get clipboard text: {}", e))
    }
    #[cfg(target_os = "android")]
    {
        Ok("Clipboard not directly supported on mobile OS".to_string())
    }
}

pub fn write_clipboard(text: &str) -> Result<(), String> {
    #[cfg(not(target_os = "android"))]
    {
        let mut clipboard = Clipboard::new().map_err(|e| format!("Failed to initialize clipboard: {}", e))?;
        clipboard.set_text(text.to_string()).map_err(|e| format!("Failed to set clipboard text: {}", e))
    }
    #[cfg(target_os = "android")]
    {
        let _ = text;
        Ok(())
    }
}
