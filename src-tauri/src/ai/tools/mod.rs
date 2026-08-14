use crate::ai::providers::ToolDefinition;
use crate::system::{file_system, terminal, clipboard, notification, git, google_search, telegram, telegram_user};
use crate::sidecar::process_manager;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager};
use crate::ai::orchestrator::AppState;

pub fn get_available_tools() -> Vec<ToolDefinition> {
    vec![
        ToolDefinition {
            name: "list_directory".to_string(),
            description: "List the contents of a directory in the workspace".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "The directory path to list (e.g. '.' or './src')"
                    }
                },
                "required": ["path"]
            }),
        },
        ToolDefinition {
            name: "read_file".to_string(),
            description: "Read the text content of a file in the workspace".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "The file path to read"
                    }
                },
                "required": ["path"]
            }),
        },
        ToolDefinition {
            name: "write_file".to_string(),
            description: "Write content to a file in the workspace".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "The file path to write to"
                    },
                    "content": {
                        "type": "string",
                        "description": "The contents to write"
                    }
                },
                "required": ["path", "content"]
            }),
        },
        ToolDefinition {
            name: "execute_command".to_string(),
            description: "Run a shell command on the local machine".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The shell command to execute"
                    }
                },
                "required": ["command"]
            }),
        },
        ToolDefinition {
            name: "run_browser_agent".to_string(),
            description: "Run the Python sidecar automation browser to crawl, click links/tabs, type text, wait, take screenshots, and scroll web pages".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The initial URL to visit (optional if steps are provided)"
                    },
                    "query": {
                        "type": "string",
                        "description": "Search or extraction query (optional if steps are provided)"
                    },
                    "steps": {
                        "type": "array",
                        "description": "Optional list of step-by-step interactive actions to execute. Example: [{\"action\": \"navigate\", \"url\": \"https://www.facebook.com\"}, {\"action\": \"wait\", \"seconds\": 3}, {\"action\": \"screenshot\", \"filename\": \"screenshot.png\"}, {\"action\": \"extract\"}]",
                        "items": {
                            "type": "object",
                            "properties": {
                                "action": {
                                    "type": "string",
                                    "description": "The type of action: 'navigate', 'click' (by CSS class or text like 'text=Reels'), 'type' (inputs text), 'scroll' (down/up), 'wait' (seconds), 'screenshot', 'extract' (webpage text)"
                                },
                                "url": { "type": "string" },
                                "selector": { "type": "string" },
                                "text": { "type": "string" },
                                "direction": { "type": "string" },
                                "count": { "type": "integer" },
                                "seconds": { "type": "integer" },
                                "filename": { "type": "string" }
                            },
                            "required": ["action"]
                        }
                    }
                }
            }),
        },
        ToolDefinition {
            name: "fetch_emails".to_string(),
            description: "Fetch unread or starred/important emails from the inbox".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "filter_type": {
                        "type": "string",
                        "description": "Email filter ('UNSEEN' for unread emails, 'FLAGGED' for important/starred/flagged emails, 'ALL' for recent emails)"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of emails to fetch (defaults to 5)"
                    },
                    "query": {
                        "type": "string",
                        "description": "Optional search term/keyword (e.g. sender name or domain like 'ClickUp', or subject/body keywords)"
                    }
                },
                "required": ["filter_type"]
            }),
        },
        ToolDefinition {
            name: "read_clipboard".to_string(),
            description: "Get the current text copied to the system clipboard".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {}
            }),
        },
        ToolDefinition {
            name: "write_clipboard".to_string(),
            description: "Copy text content onto the system clipboard".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text to copy to the clipboard"
                    }
                },
                "required": ["text"]
            }),
        },
        ToolDefinition {
            name: "send_notification".to_string(),
            description: "Send a native desktop notification to the user".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Notification header"
                    },
                    "body": {
                        "type": "string",
                        "description": "Main notification text body"
                    }
                },
                "required": ["title", "body"]
            }),
        },
        ToolDefinition {
            name: "run_git_action".to_string(),
            description: "Execute a Git command/action in the workspace".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "Git action: 'status' | 'commit_and_push' | 'fetch' | 'rebase' | 'pull'"
                    },
                    "commit_message": {
                        "type": "string",
                        "description": "Required message when action is commit_and_push"
                    },
                    "target": {
                        "type": "string",
                        "description": "Target branch/upstream (e.g. 'main', 'origin/main') when action is 'rebase'"
                    }
                },
                "required": ["action"]
            }),
        },
        ToolDefinition {
            name: "google_search".to_string(),
            description: "Search the web in the background to retrieve links, page titles, and snippets. Returns a list of search results.".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to send to the search engine (e.g. 'react developer jobs in bangladesh')"
                    }
                },
                "required": ["query"]
            }),
        },
        ToolDefinition {
            name: "control_spotify".to_string(),
            description: "Control Spotify media player on Linux: open, play, pause, go to next/previous track, or search and play music.".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "The control action to perform: 'open', 'play', 'pause', 'next', 'prev', or 'search'",
                        "enum": ["open", "play", "pause", "next", "prev", "search"]
                    },
                    "query": {
                        "type": "string",
                        "description": "The search query (e.g. song name, artist, playlist) - required ONLY when action is 'search'"
                    }
                },
                "required": ["action"]
            }),
        },
        ToolDefinition {
            name: "send_telegram".to_string(),
            description: "Send a Telegram notification/message/alert to the user".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "The message text to send to the authorized chat"
                    }
                },
                "required": ["message"]
            }),
        },
        ToolDefinition {
            name: "telegram_user_get_chats".to_string(),
            description: "List recent personal chats/groups/conversations on Telegram".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {}
            }),
        },
        ToolDefinition {
            name: "telegram_user_get_messages".to_string(),
            description: "Get recent messages from a specific Telegram chat by ID".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "chat_id": {
                        "type": "integer",
                        "description": "The target Telegram chat ID (group or user ID)"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "The number of messages to fetch (default: 10, max: 50)"
                    }
                },
                "required": ["chat_id"]
            }),
        },
        ToolDefinition {
            name: "telegram_user_send_message".to_string(),
            description: "Send/reply to a specific personal Telegram chat/username/user ID".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "chat_id": {
                        "type": "integer",
                        "description": "The target Telegram chat ID"
                    },
                    "message": {
                        "type": "string",
                        "description": "The text message content to send"
                    }
                },
                "required": ["chat_id", "message"]
            }),
        },
    ]
}

pub async fn execute_tool(
    app: AppHandle,
    name: &str,
    arguments: &str,
) -> Result<String, String> {
    let args_val: Value = serde_json::from_str(arguments)
        .map_err(|e| format!("Invalid arguments JSON: {}", e))?;

    let log_msg = format!("[Rust Orchestrator] Executing tool '{}' with arguments: {}", name, arguments);
    let _ = app.emit("sidecar-log", log_msg);

    match name {
        "list_directory" => {
            let path = args_val["path"].as_str().ok_or("Missing 'path' argument")?;
            let items = file_system::list_directory(path)?;
            Ok(serde_json::to_string(&items).unwrap_or_default())
        }
        "read_file" => {
            let path = args_val["path"].as_str().ok_or("Missing 'path' argument")?;
            file_system::read_file(path)
        }
        "write_file" => {
            let path = args_val["path"].as_str().ok_or("Missing 'path' argument")?;
            let content = args_val["content"].as_str().ok_or("Missing 'content' argument")?;
            file_system::write_file(path, content)?;
            Ok(json!({ "status": "success", "message": "File written successfully" }).to_string())
        }
        "execute_command" => {
            let command = args_val["command"].as_str().ok_or("Missing 'command' argument")?;
            terminal::execute_command(command).await
        }
        "run_browser_agent" => {
            let url = args_val["url"].as_str().unwrap_or("");
            let query = args_val["query"].as_str().unwrap_or("");
            let steps_arr = args_val["steps"].as_array();
            
            let steps_str = if let Some(arr) = steps_arr {
                serde_json::to_string(arr).unwrap_or_default()
            } else {
                "".to_string()
            };
            
            let state = app.state::<AppState>();
            let profile_path = {
                let conf = state.config.lock().unwrap();
                conf.browser_profile_path.clone()
            };
            
            process_manager::run_browser_agent(app, url, query, &steps_str, &profile_path).await
        }
        "fetch_emails" => {
            let filter_type = args_val["filter_type"].as_str().unwrap_or("UNSEEN");
            let limit = args_val["limit"].as_i64();
            let query = args_val["query"].as_str();
            let state = app.state::<AppState>();
            let config = state.config.lock().unwrap().clone();
            let server = config.email.imap_server;
            let email_addr = config.email.email_address;
            let pwd = config.email.app_password;
            process_manager::run_email_agent(app, &server, &email_addr, &pwd, filter_type, limit, query).await
        }
        "read_clipboard" => {
            clipboard::read_clipboard()
        }
        "write_clipboard" => {
            let text = args_val["text"].as_str().ok_or("Missing 'text' argument")?;
            clipboard::write_clipboard(text)?;
            Ok(json!({ "status": "success", "message": "Copied to clipboard" }).to_string())
        }
        "send_notification" => {
            let title = args_val["title"].as_str().ok_or("Missing 'title' argument")?;
            let body = args_val["body"].as_str().ok_or("Missing 'body' argument")?;
            notification::send_notification(title, body)?;
            Ok(json!({ "status": "success", "message": "Notification sent" }).to_string())
        }
        "run_git_action" => {
            let action = args_val["action"].as_str().ok_or("Missing 'action' argument")?;
            let commit_message = args_val["commit_message"].as_str();
            let target = args_val["target"].as_str();
            git::run_git_action(action, commit_message, target).await
        }
        "google_search" => {
            let query = args_val["query"].as_str().ok_or("Missing 'query' argument")?;
            let state = app.state::<AppState>();
            let (api_key, cse_id, engine) = {
                let conf = state.config.lock().unwrap();
                (conf.google_search.api_key.clone(), conf.google_search.cse_id.clone(), conf.google_search.engine.clone())
            };
            
            let result = if engine == "duckduckgo" {
                process_manager::run_ddg_search(app.clone(), query).await
            } else {
                google_search::search(&api_key, &cse_id, query).await
            };

            if result.is_ok() {
                let _ = app.emit("google-search-performed", ());
            }
            result
        }
        "control_spotify" => {
            let action = args_val["action"].as_str().ok_or("Missing 'action' argument")?;
            let query = args_val["query"].as_str();
            crate::system::spotify::control_spotify(app.clone(), action, query).await
        }
        "send_telegram" => {
            let message = args_val["message"].as_str().ok_or("Missing 'message' argument")?;
            let state = app.state::<AppState>();
            let (token, chat_id, enabled) = {
                let conf = state.config.lock().unwrap();
                (conf.telegram.token.clone(), conf.telegram.chat_id.clone(), conf.telegram.enabled)
            };
            
            if !enabled {
                return Err("Telegram integration is disabled in settings.".to_string());
            }
            
            telegram::send_telegram(&token, &chat_id, message).await
        }
        "telegram_user_get_chats" => {
            telegram_user::execute_single_command(app.clone(), "GET_CHATS").await
        }
        "telegram_user_get_messages" => {
            let chat_id = args_val["chat_id"].as_i64().ok_or("Missing 'chat_id' argument")?;
            let limit = args_val["limit"].as_i64().unwrap_or(10);
            telegram_user::execute_single_command(app.clone(), &format!("GET_MESSAGES:{}:{}", chat_id, limit)).await
        }
        "telegram_user_send_message" => {
            let chat_id = args_val["chat_id"].as_i64().ok_or("Missing 'chat_id' argument")?;
            let message = args_val["message"].as_str().ok_or("Missing 'message' argument")?;
            telegram_user::execute_single_command(app.clone(), &format!("SEND_MESSAGE:{}:{}", chat_id, message)).await
        }
        _ => Err(format!("Unknown tool: {}", name)),
    }
}
