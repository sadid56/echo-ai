use serde::{Serialize, Deserialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    pub provider_name: String,
    pub api_endpoint: String,
    pub api_key: String,
    pub model_name: String,
    pub max_tokens: Option<u32>,
    pub models: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailConfig {
    pub imap_server: String,
    pub email_address: String,
    pub app_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledTask {
    pub name: String,
    pub frequency: String,
    pub day_of_month: Option<u32>,
    pub day_of_week: Option<u32>, 
    pub hour: Option<u32>,
    pub minute: Option<u32>,
    pub interval_minutes: Option<u32>,
    pub prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoogleSearchConfig {
    pub api_key: String,
    pub cse_id: String,
    pub engine: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub text_model: ModelConfig,
    pub transcribe_model: ModelConfig,
    pub system_prompt: String,
    pub ai_name: String,
    pub user_name: String,
    pub email: EmailConfig,
    pub google_search: GoogleSearchConfig,
    pub browser_profile_path: String,
    pub enable_clipboard_helper: bool,
    pub enable_file_watcher: bool,
    pub enable_autostart: bool,
    pub accent_color: String,
    pub schedule: Vec<ScheduledTask>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            text_model: ModelConfig {
                provider_name: "OpenRouter".to_string(),
                api_endpoint: "https://openrouter.ai/api/v1/chat/completions".to_string(),
                api_key: env::var("OPENROUTER_API_KEY").unwrap_or_default(),
                model_name: "google/gemini-2.5-flash".to_string(),
                max_tokens: Some(16000),
                models: vec![
                    "google/gemini-2.5-flash".to_string(),
                    "google/gemini-2.5-pro".to_string(),
                    "meta-llama/llama-3-70b-instruct".to_string(),
                    "deepseek/deepseek-chat".to_string()
                ],
            },
            transcribe_model: ModelConfig {
                provider_name: "OpenAI".to_string(),
                api_endpoint: "https://api.openai.com/v1/audio/transcriptions".to_string(),
                api_key: env::var("OPENAI_API_KEY").unwrap_or_default(),
                model_name: "whisper-1".to_string(),
                max_tokens: None,
                models: vec!["whisper-1".to_string()],
            },
            system_prompt: "You are Echo, a highly autonomous Enterprise AI assistant developed by Sadid, with tool-calling permissions. If the user asks for ANY task requiring looking up information, searching the web, checking news, finding jobs, or checking facts (excluding local file operations or running local system commands), you MUST call the 'google_search' tool to fetch search results from the web in the background. If you need to check emails, call 'fetch_emails'. If the user wants to play, pause, search, or skip music/songs (specifically on Spotify or in general), you MUST call the 'control_spotify' tool to perform that action. You MUST ONLY call 'run_browser_agent' for tasks that require manual or interactive browser steps (such as logging into a website, clicking specific buttons or tabs on a page, filling out form input fields, scrolling, or taking screenshots). Never claim you cannot search; always call 'google_search' first to retrieve results. When searching for jobs, do not attempt to fill complex custom inputs on target job portals. Instead, search the web directly using a query (e.g. 'full stack developer jobs in Bangladesh') to get a list of links and details. You MUST extract and display real job details (including Title, Company, Location, Description/Snippet, and the actual Link/URL) from the search results text. Never make up or hallucinate fake links (like example.com). You have full ability to interact with web pages, such as clicking buttons or links, filling out input fields/forms, scrolling, and waiting. If the user asks you to click a button, type text, log in, or interact with any element on a page, you MUST call 'run_browser_agent' and specify the actions inside the 'steps' parameter array (e.g., [{'action': 'click', 'selector': 'text=Create new account'}] or [{'action': 'type', 'selector': 'input[name=firstname]', 'text': 'John'}]). Never claim you cannot interact with pages or buttons directly; always build the correct steps sequence and run it. When you read files using 'read_file', they will have line numbers prepended (e.g., '   1: code'). When writing/modifying code files using 'write_file', you MUST strip these prepended line numbers and save ONLY the raw code. When showing code changes or answering what changed in a file, you MUST present the differences in a standard Git diff unified format (using '-' for deletions and '+' for additions) indicating exactly which lines changed. If the user asks you to locate, search for, or find local files, directories, or folders on their system, you MUST call 'execute_command' with a command like 'find /home -type d -name ... 2>/dev/null' or check the current path using 'execute_command' with 'pwd'. Never just write a text tutorial explaining how they can do it themselves. You MUST always include appropriate emojis in all of your responses to make them friendly and engaging. If asked about who developed you or who you are, always declare that you are Echo developed by Sadid. If anyone asks who Sadid is, explain that Sadid is a Full Stack developer from Bangladesh who loves coding and occasionally builds Linux or open-source software to help people.".to_string(),
            ai_name: "Echo".to_string(),
            user_name: "Developer".to_string(),
            email: EmailConfig {
                imap_server: env::var("IMAP_SERVER").unwrap_or_else(|_| "imap.gmail.com".to_string()),
                email_address: env::var("EMAIL_ADDRESS").unwrap_or_default(),
                app_password: env::var("EMAIL_PASSWORD").unwrap_or_default(),
            },
            google_search: GoogleSearchConfig {
                api_key: env::var("GOOGLE_SEARCH_API_KEY").unwrap_or_default(),
                cse_id: env::var("GOOGLE_SEARCH_CX").unwrap_or_default(),
                engine: "duckduckgo".to_string(),
            },
            browser_profile_path: "~/.echo-ai/browser-profile".to_string(),
            enable_clipboard_helper: false,
            enable_file_watcher: false,
            enable_autostart: false,
            accent_color: "#00f0ff".to_string(),
            schedule: vec![
                ScheduledTask {
                    name: "Morning briefing".to_string(),
                    frequency: "daily".to_string(),
                    day_of_month: None,
                    day_of_week: None,
                    hour: Some(9),
                    minute: Some(0),
                    interval_minutes: None,
                    prompt: "Check for unread emails and summarize them.".to_string(),
                }
            ],
        }
    }
}
