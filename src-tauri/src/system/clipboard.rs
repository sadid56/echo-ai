use arboard::Clipboard;

pub fn read_clipboard() -> Result<String, String> {
    let mut clipboard = Clipboard::new().map_err(|e| format!("Failed to initialize clipboard: {}", e))?;
    clipboard.get_text().map_err(|e| format!("Failed to get clipboard text: {}", e))
}

pub fn write_clipboard(text: &str) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| format!("Failed to initialize clipboard: {}", e))?;
    clipboard.set_text(text.to_string()).map_err(|e| format!("Failed to set clipboard text: {}", e))
}
