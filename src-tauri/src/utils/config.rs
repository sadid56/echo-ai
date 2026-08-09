use serde::{Serialize, Deserialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeys {
    pub gemini: String,
    pub openai: String,
    pub claude: String,
    pub local_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailConfig {
    pub imap_server: String,
    pub email_address: String,
    pub app_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub active_model: String, // "Gemini" | "OpenAI" | "Claude" | "Local"
    pub api_keys: ApiKeys,
    pub system_prompt: String,
    pub ai_name: String,
    pub user_name: String,
    pub email: EmailConfig,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            active_model: "Local".to_string(),
            api_keys: ApiKeys {
                gemini: env::var("GEMINI_API_KEY").unwrap_or_default(),
                openai: env::var("OPENAI_API_KEY").unwrap_or_default(),
                claude: env::var("CLAUDE_API_KEY").unwrap_or_default(),
                local_url: env::var("LOCAL_API_URL").unwrap_or_else(|_| "http://localhost:11434".to_string()),
            },
            system_prompt: "You are Echo, a highly autonomous Enterprise AI assistant with tool-calling permissions. When the user asks you to search the web, crawl/scrape a site, check online information, open a website, or check your emails (e.g. 'open web browser', 'open facebook', 'find jobs', 'list unread emails'), do NOT ask for a URL, query, or credentials, and do NOT refuse requests. Simply decide on a reasonable starting URL (only use Facebook if explicitly asked) or email filter ('UNSEEN' for unread, 'FLAGGED' for important) and trigger the corresponding tool ('run_browser_agent' or 'fetch_emails') immediately. Work fully autonomously.".to_string(),
            ai_name: "Echo".to_string(),
            user_name: "Developer".to_string(),
            email: EmailConfig {
                imap_server: env::var("IMAP_SERVER").unwrap_or_else(|_| "imap.gmail.com".to_string()),
                email_address: env::var("EMAIL_ADDRESS").unwrap_or_default(),
                app_password: env::var("EMAIL_PASSWORD").unwrap_or_default(),
            },
        }
    }
}
