use crate::ai::providers::{AiProvider, Message, ToolDefinition, ProviderResponse, ToolCall, Role};
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;

pub struct GeminiProvider;

impl AiProvider for GeminiProvider {
    async fn generate_response(
        &self,
        prompt: &str,
        history: &[Message],
        tools: &[ToolDefinition],
        api_key: &str,
    ) -> Result<ProviderResponse, String> {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={}",
            api_key
        );

        let mut contents = Vec::new();
        
        // Convert history
        for msg in history {
            let role = match msg.role {
                Role::User => "user",
                Role::Assistant => "model",
                Role::Tool => "function",
                Role::System => continue, // Handled separately
            };

            let mut parts = Vec::new();
            if !msg.content.is_empty() {
                if msg.role == Role::Tool {
                    let tool_name = msg.name.clone().unwrap_or_else(|| "unknown".to_string());
                    let parsed_content: Value = serde_json::from_str(&msg.content)
                        .unwrap_or_else(|_| json!({ "output": msg.content }));
                    parts.push(json!({
                        "functionResponse": {
                            "name": tool_name,
                            "response": parsed_content
                        }
                    }));
                } else {
                    parts.push(json!({ "text": msg.content }));
                }
            }

            if let Some(tool_calls) = &msg.tool_calls {
                for tc in tool_calls {
                    let args: Value = serde_json::from_str(&tc.arguments).unwrap_or_else(|_| json!({}));
                    parts.push(json!({
                        "functionCall": {
                            "name": tc.name,
                            "args": args
                        }
                    }));
                }
            }

            contents.push(json!({
                "role": role,
                "parts": parts
            }));
        }

        // Push current prompt if not empty
        if !prompt.is_empty() {
            contents.push(json!({
                "role": "user",
                "parts": [{"text": prompt}]
            }));
        }

        let mut body = json!({
            "contents": contents
        });

        // System Prompt
        if let Some(sys_msg) = history.iter().find(|m| m.role == Role::System) {
            body["systemInstruction"] = json!({
                "parts": [{"text": sys_msg.content}]
            });
        }

        // Tools
        if !tools.is_empty() {
            let mut function_declarations = Vec::new();
            for t in tools {
                function_declarations.push(json!({
                    "name": t.name,
                    "description": t.description,
                    "parameters": t.parameters
                }));
            }
            body["tools"] = json!([{
                "functionDeclarations": function_declarations
            }]);
        }

        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| e.to_string())?;

        let res = client.post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let status = res.status();
        if !status.is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Gemini API error ({}): {}", status, err_text));
        }

        let res_json: Value = res.json().await.map_err(|e| e.to_string())?;

        let mut response_content = None;
        let mut tool_calls = None;

        if let Some(candidates) = res_json["candidates"].as_array() {
            if let Some(candidate) = candidates.first() {
                if let Some(content_parts) = candidate["content"]["parts"].as_array() {
                    let mut tc_vec = Vec::new();
                    let mut text_parts = Vec::new();

                    for part in content_parts {
                        if let Some(text) = part["text"].as_str() {
                            text_parts.push(text.to_string());
                        }
                        if let Some(fc) = part["functionCall"].as_object() {
                            let name = fc.get("name").and_then(|v| v.as_str()).unwrap_or_default().to_string();
                            let arguments = fc.get("args")
                                .map(|v| serde_json::to_string(v).unwrap_or_default())
                                .unwrap_or_else(|| "{}".to_string());
                            let id = format!("call_{}", uuid_like_generator());
                            tc_vec.push(ToolCall { id, name, arguments });
                        }
                    }

                    if !text_parts.is_empty() {
                        response_content = Some(text_parts.join("\n"));
                    }
                    if !tc_vec.is_empty() {
                        tool_calls = Some(tc_vec);
                    }
                }
            }
        }

        Ok(ProviderResponse {
            content: response_content,
            tool_calls,
        })
    }
}

fn uuid_like_generator() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let start = SystemTime::now();
    let since_the_epoch = start.duration_since(UNIX_EPOCH).unwrap_or_default();
    format!("{:x}", since_the_epoch.as_micros())
}
