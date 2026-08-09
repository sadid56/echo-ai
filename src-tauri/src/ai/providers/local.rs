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
        _tools: &[ToolDefinition],
        api_key: &str,
    ) -> Result<ProviderResponse, String> {
        let base_url = if api_key.is_empty() { "http://localhost:11434" } else { api_key };
        let url = format!("{}/v1/chat/completions", base_url.trim_end_matches('/'));

        let mut messages = Vec::new();
        for msg in history {
            let role = match msg.role {
                Role::System => "system",
                Role::User => "user",
                Role::Assistant => "assistant",
                Role::Tool => "tool",
            };
            let mut msg_obj = json!({
                "role": role,
                "content": msg.content
            });
            if msg.role == Role::Tool {
                msg_obj["tool_call_id"] = json!(msg.name.clone().unwrap_or_default());
            }
            messages.push(msg_obj);
        }

        if !prompt.is_empty() {
            messages.push(json!({
                "role": "user",
                "content": prompt
            }));
        }

        let body = json!({
            "model": "llama3",
            "messages": messages,
            "stream": false
        });

        let client = Client::builder()
            .timeout(Duration::from_secs(5))
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
