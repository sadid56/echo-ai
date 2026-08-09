use crate::ai::providers::ToolDefinition;
use crate::system::{file_system, terminal, clipboard, notification, git};
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
            description: "Perform common Git operations (status, diff, commit_and_push, rebase, rebase_continue, rebase_abort)".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "Git action: 'status', 'diff', 'commit_and_push', 'rebase', 'rebase_continue', or 'rebase_abort'"
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
            name: "get_active_notifications".to_string(),
            description: "Read active desktop notifications on the user's OS".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {}
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
            
            process_manager::run_python_agent(app, url, query, &steps_str).await
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
        "get_active_notifications" => {
            notification::get_active_notifications().await
        }
        _ => Err(format!("Unknown tool: {}", name)),
    }
}
