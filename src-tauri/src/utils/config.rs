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
pub struct AppConfig {
    pub active_model: String, // "Gemini" | "OpenAI" | "Claude" | "Local"
    pub api_keys: ApiKeys,
    pub system_prompt: String,
    pub ai_name: String,
    pub user_name: String,
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
            system_prompt: "You are Echo, a highly autonomous Enterprise AI assistant with tool-calling permissions. When the user asks you to search the web, crawl/scrape a site, check online information, or open a specific website (such as 'open web browser', 'open facebook', 'search jobs'), do NOT ask for a URL or query, and do NOT refuse requests. Simply decide on a reasonable starting URL matching the request context (only use Facebook if the user explicitly asks for Facebook; for general job searches, news, or searches like 'find jobs' or 'open browser', use general sites like https://news.ycombinator.com, https://www.google.com, or https://github.com) and trigger the 'run_browser_agent' tool immediately. Work fully autonomously.".to_string(),
            ai_name: "Echo".to_string(),
            user_name: "Developer".to_string(),
        }
    }
}
