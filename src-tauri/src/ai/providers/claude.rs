use crate::ai::providers::{AiProvider, Message, ToolDefinition, ProviderResponse, ToolCall, Role};
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;

pub struct ClaudeProvider;

impl AiProvider for ClaudeProvider {
    async fn generate_response(
        &self,
        prompt: &str,
        history: &[Message],
        tools: &[ToolDefinition],
        api_key: &str,
    ) -> Result<ProviderResponse, String> {
        let url = "https://api.anthropic.com/v1/messages";

        let mut messages = Vec::new();
        let mut system_prompt = None;

        // Process system instructions & dialogue history
        for msg in history {
            match msg.role {
                Role::System => {
                    system_prompt = Some(msg.content.clone());
                }
                Role::User => {
                    messages.push(json!({
                        "role": "user",
                        "content": msg.content
                    }));
                }
                Role::Assistant => {
                    let mut content_blocks = Vec::new();
                    if !msg.content.is_empty() {
                        content_blocks.push(json!({
                            "type": "text",
                            "text": msg.content
                        }));
                    }
                    if let Some(tool_calls) = &msg.tool_calls {
                        for tc in tool_calls {
                            let input: Value = serde_json::from_str(&tc.arguments).unwrap_or_else(|_| json!({}));
                            content_blocks.push(json!({
                                "type": "tool_use",
                                "id": tc.id,
                                "name": tc.name,
                                "input": input
                            }));
                        }
                    }
                    messages.push(json!({
                        "role": "assistant",
                        "content": content_blocks
                    }));
                }
                Role::Tool => {
                    let tc_id = msg.name.clone().unwrap_or_else(|| "unknown".to_string());
                    messages.push(json!({
                        "role": "user",
                        "content": [
                            {
                                "type": "tool_result",
                                "tool_use_id": tc_id,
                                "content": msg.content
                            }
                        ]
                    }));
                }
            }
        }

        // Push current prompt if not empty
        if !prompt.is_empty() {
            messages.push(json!({
                "role": "user",
                "content": prompt
            }));
        }

        let mut body = json!({
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 4096,
            "messages": messages
        });

        if let Some(sys) = system_prompt {
            body["system"] = json!(sys);
        }

        // Tools
        if !tools.is_empty() {
            let mut tool_arr = Vec::new();
            for t in tools {
                tool_arr.push(json!({
                    "name": t.name,
                    "description": t.description,
                    "input_schema": t.parameters
                }));
            }
            body["tools"] = json!(tool_arr);
        }

        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| e.to_string())?;

        let res = client.post(url)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let status = res.status();
        if !status.is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Claude API error ({}): {}", status, err_text));
        }

        let res_json: Value = res.json().await.map_err(|e| e.to_string())?;

        let mut response_content = None;
        let mut tool_calls = None;

        if let Some(content_arr) = res_json["content"].as_array() {
            let mut text_parts = Vec::new();
            let mut tc_vec = Vec::new();

            for block in content_arr {
                if let Some(block_type) = block["type"].as_str() {
                    if block_type == "text" {
                        if let Some(text) = block["text"].as_str() {
                            text_parts.push(text.to_string());
                        }
                    } else if block_type == "tool_use" {
                        let id = block["id"].as_str().unwrap_or_default().to_string();
                        let name = block["name"].as_str().unwrap_or_default().to_string();
                        let input = block["input"].clone();
                        let arguments = serde_json::to_string(&input).unwrap_or_default();
                        tc_vec.push(ToolCall { id, name, arguments });
                    }
                }
            }

            if !text_parts.is_empty() {
                response_content = Some(text_parts.join("\n"));
            }
            if !tc_vec.is_empty() {
                tool_calls = Some(tc_vec);
            }
        }

        Ok(ProviderResponse {
            content: response_content,
            tool_calls,
        })
    }
}
