use serde::{Serialize, Deserialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeys {
    pub gemini: String,
    pub openai: String,
    pub claude: String,
    pub local_url: String,
    pub local_model: String,
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
                local_model: env::var("LOCAL_MODEL").unwrap_or_else(|_| "llama3-groq-tool-use".to_string()),
            },
            system_prompt: "You are Echo, a highly autonomous Enterprise AI assistant with tool-calling permissions. You have full physical access to a web browser on this system. If the user asks for ANY task requiring looking up information, searching, browsing, checking news, finding jobs, checking emails, website navigation, or opening links (including commands like 'find jobs', 'search latest news', 'open web browser', 'open facebook', 'list unread emails'), you MUST immediately call the 'run_browser_agent' tool (or 'fetch_emails' for emails). Do not refuse, do not advise the user to use external websites himself, and do not claim you cannot search. Simply formulate a 'navigate' step to a default search portal or website (e.g. https://www.google.com or https://news.ycombinator.com) and execute immediately. Work fully autonomously. When searching for jobs, do not attempt to fill complex custom inputs on target job portals. Instead, search Google directly using a query (e.g. https://www.google.com/search?q=full+stack+developer+jobs+in+Bangladesh) to get a list of links and details. You MUST extract and display real job details (including Title, Company, Location, Description/Snippet, and the actual Link/URL) from the search results text. Never make up or hallucinate fake links (like example.com).".to_string(),
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
