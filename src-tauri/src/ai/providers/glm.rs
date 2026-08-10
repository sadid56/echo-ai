use crate::ai::providers::{AiProvider, Message, ToolDefinition, ProviderResponse, ToolCall, Role};
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;

pub struct GlmProvider;

impl AiProvider for GlmProvider {
    async fn generate_response(
        &self,
        prompt: &str,
        history: &[Message],
        tools: &[ToolDefinition],
        api_key: &str,
    ) -> Result<ProviderResponse, String> {
        let url = "https://api.z.ai/api/paas/v4/chat/completions";

        let mut messages = Vec::new();

        // Add history
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

        // Push current prompt if not empty
        if !prompt.is_empty() {
            messages.push(json!({
                "role": "user",
                "content": prompt
            }));
        }

        let mut body = json!({
            "model": "glm-4.5-flash",
            "messages": messages
        });

        // Tools
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
            .timeout(Duration::from_secs(60))
            .build()
            .map_err(|e| e.to_string())?;

        let res = client.post(url)
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let status = res.status();
        if !status.is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("GLM API error ({}): {}", status, err_text));
        }

        let res_json: Value = res.json().await.map_err(|e| e.to_string())?;

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

        Ok(ProviderResponse {
            content: response_content,
            tool_calls,
        })
    }
}
