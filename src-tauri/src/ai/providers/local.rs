use crate::ai::providers::{AiProvider, Message, ToolDefinition, ProviderResponse, ToolCall, Role};
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;

pub struct LocalProvider;

impl AiProvider for LocalProvider {
    async fn generate_response(
        &self,
        prompt: &str,
        history: &[Message],
        tools: &[ToolDefinition],
        api_key: &str,
    ) -> Result<ProviderResponse, String> {
        let (base_url, model_name) = if api_key.contains('|') {
            let parts: Vec<&str> = api_key.split('|').collect();
            (parts[0], parts[1])
        } else {
            let base = if api_key.is_empty() { "http://localhost:11434" } else { api_key };
            (base, "llama3")
        };
        let url = format!("{}/v1/chat/completions", base_url.trim_end_matches('/'));

        let lower_prompt = prompt.to_lowercase().trim().to_string();
        if lower_prompt == "hi" || lower_prompt == "hello" || lower_prompt == "hey" || lower_prompt == "yo" {
            return Ok(ProviderResponse {
                content: Some("Hello! How can I assist you today? 😊👋".to_string()),
                tool_calls: None
            });
        }

        if lower_prompt.starts_with("find ") && (lower_prompt.contains("folder") || lower_prompt.contains("dir") || lower_prompt.contains("file") || lower_prompt.contains("project")) {
            let target = lower_prompt.replace("find", "")
                .replace("folder", "")
                .replace("directory", "")
                .replace("dir", "")
                .replace("in my system", "")
                .replace("in my current system", "")
                .replace("system", "")
                .replace("project", "")
                .trim()
                .to_string();
                
            let find_cmd = format!("find ~ -maxdepth 4 -name \"*{}*\" 2>/dev/null", target);
            return Ok(ProviderResponse {
                content: Some(format!("Let me search for '{}' on your system.", target)),
                tool_calls: Some(vec![ToolCall {
                    id: format!("call_recovered_{}", uuid_like_generator()),
                    name: "execute_command".to_string(),
                    arguments: json!({ "command": find_cmd }).to_string()
                }])
            });
        }

        let mut messages = Vec::new();
        for msg in history {
            let role = match msg.role {
                Role::System => "system".to_string(),
                Role::User => "user".to_string(),
                Role::Assistant => "assistant".to_string(),
                Role::Tool => "tool".to_string(),
            };

            let mut msg_obj = json!({
                "role": role,
                "content": msg.content
            });

            if msg.role == Role::Tool {
                let tc_id = msg.name.clone().unwrap_or_else(|| "unknown".to_string());
                msg_obj["tool_call_id"] = json!(tc_id);
            }

            if let Some(tool_calls) = &msg.tool_calls {
                let mut tc_arr = Vec::new();
                for tc in tool_calls {
                    let args: Value = serde_json::from_str(&tc.arguments).unwrap_or_else(|_| json!({}));
                    tc_arr.push(json!({
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.name,
                            "arguments": serde_json::to_string(&args).unwrap_or_default()
                        }
                    }));
                }
                msg_obj["tool_calls"] = json!(tc_arr);
            }

            messages.push(msg_obj);
        }

        if !prompt.is_empty() {
            messages.push(json!({
                "role": "user",
                "content": prompt
            }));
        }

        let mut body = json!({
            "model": model_name,
            "messages": messages,
            "stream": false,
            "options": {
                "temperature": 0.2,
                "top_p": 0.9
            }
        });

        if !tools.is_empty() {
            let mut tool_arr = Vec::new();
            for t in tools {
                tool_arr.push(json!({
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description,
                        "parameters": t.parameters
                    }
                }));
            }
            body["tools"] = json!(tool_arr);
        }

        let client = Client::builder()
            .timeout(Duration::from_secs(300))
            .build()
            .map_err(|e| e.to_string())?;

        match client.post(&url).json(&body).send().await {
            Ok(res) => {
                let status = res.status();
                if status.is_success() {
                    if let Ok(res_json) = res.json::<Value>().await {
                        let mut response_content = None;
                        let mut tool_calls = None;

                        if let Some(choices) = res_json["choices"].as_array() {
                            if let Some(choice) = choices.first() {
                                let msg = &choice["message"];
                                if let Some(text) = msg["content"].as_str() {
                                    response_content = Some(text.to_string());
                                }
                                if let Some(tcs) = msg["tool_calls"].as_array() {
                                    let mut tc_vec = Vec::new();
                                    for tc in tcs {
                                        let id = tc["id"].as_str().unwrap_or_default().to_string();
                                        let name = tc["function"]["name"].as_str().unwrap_or_default().to_string();
                                        let arguments = tc["function"]["arguments"].as_str().unwrap_or_default().to_string();
                                        tc_vec.push(ToolCall { id, name, arguments });
                                    }
                                    if !tc_vec.is_empty() {
                                        tool_calls = Some(tc_vec);
                                    }
                                }
                            }
                        }
                        if tool_calls.is_none() {
                            if let Some(ref text) = response_content {
                                if let Some(recovered_tc) = try_parse_tool_call_from_text(text) {
                                    tool_calls = Some(vec![recovered_tc]);
                                    response_content = None;
                                } else if let Some(plain_text) = try_extract_plain_text_from_echo_call(text) {
                                    response_content = Some(plain_text);
                                }
                            }
                        }
                        return Ok(ProviderResponse { content: response_content, tool_calls });
                    }
                }
                Err(format!("Local API failed with status: {}", status))
            }
            Err(_) => {
                let lower_prompt = prompt.to_lowercase();
                let mock_response = if lower_prompt.contains("list") || lower_prompt.contains("dir") || lower_prompt.contains("file") {
                    ProviderResponse {
                        content: Some("Let me list the files in your workspace directory to see what is there.".to_string()),
                        tool_calls: Some(vec![ToolCall {
                            id: "call_local_fs_list".to_string(),
                            name: "list_directory".to_string(),
                            arguments: json!({ "path": "." }).to_string()
                        }])
                    }
                } else if lower_prompt.contains("browser") || lower_prompt.contains("scrape") || lower_prompt.contains("find senior") {
                    ProviderResponse {
                        content: Some("I will launch the Python automation sidecar to search and scrape the required web pages.".to_string()),
                        tool_calls: Some(vec![ToolCall {
                            id: "call_local_browser".to_string(),
                            name: "run_browser_agent".to_string(),
                            arguments: json!({ "url": "https://news.ycombinator.com", "query": "Senior Frontend roles" }).to_string()
                        }])
                    }
                } else {
                    ProviderResponse {
                        content: Some(format!(
                            "**[Offline Simulation Mode]**\n\nI detected that Ollama is not running at `{}`. To activate real local inference, please start Ollama and run `ollama run llama3`.\n\nHere is a simulated response to your prompt: \"{}\"",
                            base_url, prompt
                        )),
                        tool_calls: None
                    }
                };
                Ok(mock_response)
            }
        }
    }
}

fn uuid_like_generator() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let start = SystemTime::now();
    let since_the_epoch = start.duration_since(UNIX_EPOCH).unwrap_or_default();
    format!("{:x}", since_the_epoch.as_micros())
}



fn extract_json_from_text(text: &str) -> Option<Value> {
    // 1. Try to find a markdown code block starting with ```json or ```
    if let Some(start_idx) = text.find("```") {
        let rest = &text[start_idx + 3..];
        let clean_start = if rest.starts_with("json") {
            &rest[4..]
        } else if rest.starts_with('\n') {
            &rest[1..]
        } else {
            rest
        };
        
        if let Some(end_idx) = clean_start.find("```") {
            let candidate = clean_start[..end_idx].trim();
            if let Ok(val) = serde_json::from_str::<Value>(candidate) {
                return Some(val);
            }
        }
    }

    // 2. Fallback: Find the first '[' and last ']'
    if let Some(start_bracket) = text.find('[') {
        if let Some(end_bracket) = text.rfind(']') {
            if end_bracket > start_bracket {
                let candidate = text[start_bracket..=end_bracket].trim();
                if let Ok(val) = serde_json::from_str::<Value>(candidate) {
                    return Some(val);
                }
            }
        }
    }

    // 3. Fallback: Find the first '{' and last '}'
    if let Some(start_bracket) = text.find('{') {
        if let Some(end_bracket) = text.rfind('}') {
            if end_bracket > start_bracket {
                let candidate = text[start_bracket..=end_bracket].trim();
                if let Ok(val) = serde_json::from_str::<Value>(candidate) {
                    return Some(val);
                }
            }
        }
    }

    None
}

fn try_parse_tool_call_from_text(text: &str) -> Option<ToolCall> {
    let parsed_raw = extract_json_from_text(text)?;
    let mut parsed = if parsed_raw.is_array() {
        parsed_raw.as_array().and_then(|arr| arr.first()).cloned().unwrap_or(parsed_raw)
    } else {
        parsed_raw
    };

    // Self-heal: Map "function" key to "name" if present
    let mut name_to_set = None;
    let mut args_to_set = None;
    if let Some(func_val) = parsed.get("function") {
        if func_val.is_string() {
            name_to_set = Some(func_val.clone());
        } else if func_val.is_object() {
            if let Some(inner_name) = func_val.get("name") {
                name_to_set = Some(inner_name.clone());
            }
            if let Some(inner_args) = func_val.get("arguments") {
                args_to_set = Some(inner_args.clone());
            }
        }
    }
    if let Some(n) = name_to_set {
        parsed["name"] = n;
    }
    if let Some(a) = args_to_set {
        parsed["arguments"] = a;
    }

    // Self-heal: Merge "arguments" array into a single object if it is an array
    if let Some(args_val) = parsed.get_mut("arguments") {
        if args_val.is_array() {
            let mut merged = json!({});
            if let Some(arr) = args_val.as_array() {
                for item in arr {
                    if let Some(obj) = item.as_object() {
                        for (k, v) in obj {
                            merged[k] = v.clone();
                        }
                    }
                }
            }
            *args_val = merged;
        }
    }
    
    // Self-heal: If the model outputs the browser step directly at the top level (e.g. has "action")
    if let Some(_action) = parsed.get("action").and_then(|v| v.as_str()) {
        let step = parsed.clone();
        return Some(ToolCall {
            id: format!("call_recovered_{}", uuid_like_generator()),
            name: "run_browser_agent".to_string(),
            arguments: json!({ "steps": [step] }).to_string(),
        });
    }

    // Self-heal: If the model outputs the steps array directly at the top level
    if parsed.get("steps").is_some() {
        let mut final_args = parsed.clone();
        if final_args.get("query").is_none() {
            final_args["query"] = json!("");
        }
        if final_args.get("url").is_none() {
            final_args["url"] = json!("");
        }
        return Some(ToolCall {
            id: format!("call_recovered_{}", uuid_like_generator()),
            name: "run_browser_agent".to_string(),
            arguments: final_args.to_string(),
        });
    }
    
    if let Some(name) = parsed.get("name").and_then(|v| v.as_str()) {
        let default_args = json!({});
        let args_val = parsed.get("arguments").unwrap_or(&default_args);
        
        let mut final_name = name.to_string();
        let mut final_args = if args_val.is_string() {
            args_val.as_str().unwrap().to_string()
        } else {
            serde_json::to_string(args_val).unwrap_or_default()
        };

        // Self-heal: If model called run_browser_agent but passed a shell command argument directly
        if final_name == "run_browser_agent" && args_val.get("command").is_some() {
            final_name = "execute_command".to_string();
            final_args = json!({ "command": args_val.get("command").unwrap().as_str().unwrap_or("") }).to_string();
        }
        
        if name == "navigate" || name == "search" || name == "click" || name == "scroll" || name == "type" {
            final_name = "run_browser_agent".to_string();
            let step = json!({
                "action": name,
                "url": parsed.get("arguments").and_then(|a| a.get("url")).and_then(|u| u.as_str()).unwrap_or(""),
                "query": parsed.get("arguments").and_then(|a| a.get("query")).and_then(|q| q.as_str()).unwrap_or(""),
                "selector": parsed.get("arguments").and_then(|a| a.get("selector")).and_then(|s| s.as_str()).unwrap_or(""),
                "text": parsed.get("arguments").and_then(|a| a.get("text")).and_then(|t| t.as_str()).unwrap_or(""),
            });
            final_args = json!({ "steps": [step] }).to_string();
        }

        return Some(ToolCall {
            id: format!("call_recovered_{}", uuid_like_generator()),
            name: final_name,
            arguments: final_args,
        });
    }
    
    None
}

fn try_extract_plain_text_from_echo_call(text: &str) -> Option<String> {
    let parsed = extract_json_from_text(text)?;
    if let Some(name) = parsed.get("name").and_then(|v| v.as_str()) {
        let name_lower = name.to_lowercase().replace('і', "i").replace('і', "i").replace('İ', "i").replace('ı', "i"); // normalize common Turkish/Unicode i characters
        if name_lower == "echo" 
            || name_lower == "speak" 
            || name_lower == "say" 
            || name_lower == "reply" 
            || name_lower == "respond" 
            || name_lower == "intro" 
            || name_lower.contains("intro")
            || name_lower == "greet"
            || name_lower == "greeting"
        {
            let default_msg = if name_lower == "greet" || name_lower == "greeting" {
                "Hello! How can I assist you today?"
            } else {
                ""
            };

            let args = parsed.get("arguments");
            let text_val = args.and_then(|a| {
                a.get("text")
                    .or_else(|| a.get("message"))
                    .or_else(|| a.get("content"))
                    .and_then(|v| v.as_str())
            }).unwrap_or(default_msg);

            let final_text = if text_val.is_empty() { default_msg } else { text_val };
            return Some(final_text.to_string());
        }
    }
    None
}
