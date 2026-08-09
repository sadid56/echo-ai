use crate::ai::providers::ToolDefinition;
use crate::system::{file_system, terminal};
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
            description: "Run the Python sidecar automation browser to crawl and scrape web pages".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The initial URL to visit"
                    },
                    "query": {
                        "type": "string",
                        "description": "The search query or extraction objective for the browser"
                    }
                },
                "required": ["url", "query"]
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
                    }
                },
                "required": ["filter_type"]
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
            let url = args_val["url"].as_str().ok_or("Missing 'url' argument")?;
            let query = args_val["query"].as_str().ok_or("Missing 'query' argument")?;
            process_manager::run_python_agent(app, url, query).await
        }
        "fetch_emails" => {
            let filter_type = args_val["filter_type"].as_str().unwrap_or("UNSEEN");
            let state = app.state::<AppState>();
            let config = state.config.lock().unwrap().clone();
            let server = config.email.imap_server;
            let email_addr = config.email.email_address;
            let pwd = config.email.app_password;
            process_manager::run_email_agent(app, &server, &email_addr, &pwd, filter_type).await
        }
        _ => Err(format!("Unknown tool: {}", name)),
    }
}
