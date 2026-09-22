use crate::ai::providers::{Message, ToolDefinition, ProviderResponse, ToolCall, Role, Attachment};
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;

pub struct OpenAiCompatibleProvider;

impl OpenAiCompatibleProvider {
    pub async fn generate_response(
        &self,
        endpoint: &str,
        api_key: &str,
        model_name: &str,
        prompt: &str,
        history: &[Message],
        tools: &[ToolDefinition],
        max_tokens: Option<u32>,
        attachments: Option<&Vec<Attachment>>,
    ) -> Result<ProviderResponse, String> {
        let is_gemini = endpoint.contains("generativelanguage.googleapis.com");
        let mut last_sent_native_tool_calls = false;
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

            if let Some(ref sig) = msg.thought_signature {
                msg_obj["thought_signature"] = json!(sig);
            }

            if msg.role == Role::Tool {
                if is_gemini && !last_sent_native_tool_calls {
                    // Preceding assistant message had tool_calls stripped or lacked thought_signature.
                    // Gemini requires every 'tool' role message to pair with a preceding 'tool_calls' message.
                    // Convert to user message context so Gemini doesn't reject it.
                    msg_obj["role"] = json!("user");
                    msg_obj["content"] = json!(format!("[Tool result for '{}']: {}", msg.name.as_deref().unwrap_or("tool"), msg.content));
                } else {
                    let tc_id = msg.name.clone().unwrap_or_else(|| "unknown".to_string());
                    msg_obj["tool_call_id"] = json!(tc_id);
                }
            }

            if let Some(tool_calls) = &msg.tool_calls {
                // If Gemini, check if any tool call lacks thought_signature (e.g. from previous sessions or failed calls)
                let missing_sig = is_gemini && tool_calls.iter().any(|tc| tc.thought_signature.is_none());

                if missing_sig {
                    last_sent_native_tool_calls = false;
                    let mut extra_desc = String::new();
                    for tc in tool_calls {
                        extra_desc.push_str(&format!("\n[Action: Called tool '{}' with arguments: {}]", tc.name, tc.arguments));
                    }
                    if let Some(content_str) = msg_obj["content"].as_str() {
                        msg_obj["content"] = json!(format!("{}{}", content_str, extra_desc));
                    } else {
                        msg_obj["content"] = json!(extra_desc);
                    }
                } else {
                    last_sent_native_tool_calls = true;
                    let mut tc_arr = Vec::new();
                    for tc in tool_calls {
                        let args: Value = serde_json::from_str(&tc.arguments).unwrap_or_else(|_| json!({}));
                        let mut tc_obj = json!({
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.name,
                                "arguments": serde_json::to_string(&args).unwrap_or_default()
                            }
                        });
                        if let Some(ref sig) = tc.thought_signature {
                            tc_obj["thought_signature"] = json!(sig);
                            tc_obj["function"]["thought_signature"] = json!(sig);
                        }
                        tc_arr.push(tc_obj);
                    }
                    msg_obj["tool_calls"] = json!(tc_arr);
                }
            } else if msg.role == Role::Assistant {
                last_sent_native_tool_calls = false;
            }

            messages.push(msg_obj);
        }

        // Push current prompt if not empty
        if !prompt.is_empty() {
            if let Some(atts) = attachments {
                if !atts.is_empty() {
                    let mut content_array = Vec::new();
                    
                    // Add text prompt
                    content_array.push(json!({
                        "type": "text",
                        "text": prompt
                    }));
                    
                    // Add image attachments
                    for att in atts {
                        if att.mime_type.starts_with("image/") {
                            content_array.push(json!({
                                "type": "image_url",
                                "image_url": {
                                    "url": format!("data:{};base64,{}", att.mime_type, att.data)
                                }
                            }));
                        }
                    }
                    
                    messages.push(json!({
                        "role": "user",
                        "content": content_array
                    }));
                } else {
                    messages.push(json!({
                        "role": "user",
                        "content": prompt
                    }));
                }
            } else {
                messages.push(json!({
                    "role": "user",
                    "content": prompt
                }));
            }
        }

        let mut body = json!({
            "model": model_name,
            "messages": messages
        });

        if let Some(tokens) = max_tokens {
            body["max_tokens"] = json!(tokens);
        }

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

        let mut attempts = 0;
        let max_attempts = 2;

        let res = loop {
            attempts += 1;

            let mut req = client.post(endpoint);
            if !api_key.is_empty() {
                req = req.header("Authorization", format!("Bearer {}", api_key));
            }

            let res = req.json(&body)
                .send()
                .await
                .map_err(|e| e.to_string())?;

            if res.status() == reqwest::StatusCode::TOO_MANY_REQUESTS && attempts < max_attempts {
                let mut retry_secs = res.headers()
                    .get("retry-after")
                    .and_then(|h| h.to_str().ok())
                    .and_then(|s| s.parse::<f64>().ok())
                    .map(|s| s.ceil() as u64);

                let err_text = res.text().await.unwrap_or_default();

                if retry_secs.is_none() {
                    if let Some(start) = err_text.find("Please try again in ") {
                        let rest = &err_text[start + 20..];
                        if let Some(end) = rest.find('s') {
                            if let Ok(val) = rest[..end].parse::<f64>() {
                                retry_secs = Some(val.ceil() as u64);
                            }
                        }
                    }
                }

                let wait_time = retry_secs.unwrap_or(8);
                if wait_time <= 15 {
                    tokio::time::sleep(Duration::from_secs(wait_time + 1)).await;
                    continue;
                } else {
                    if let Ok(err_json) = serde_json::from_str::<Value>(&err_text) {
                        if let Some(msg) = err_json["error"]["message"].as_str() {
                            return Err(format!("API Error (429 Too Many Requests): {}", msg));
                        }
                    }
                    return Err(format!("API Error (429 Too Many Requests): {}", err_text));
                }
            }

            break res;
        };

        let status = res.status();
        if !status.is_success() {
            let err_text = res.text().await.unwrap_or_default();
            // Parse error message if it's formatted as standard OpenAI JSON error
            if let Ok(err_json) = serde_json::from_str::<Value>(&err_text) {
                if let Some(msg) = err_json["error"]["message"].as_str() {
                    return Err(format!("API Error ({}): {}", status, msg));
                }
            }
            return Err(format!("API Error ({}): {}", status, err_text));
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
                let msg_thought_sig = msg["thought_signature"]
                    .as_str()
                    .or_else(|| msg["signature"].as_str())
                    .map(|s| s.to_string());

                if let Some(tcs) = msg["tool_calls"].as_array() {
                    let mut tc_vec = Vec::new();
                    for tc in tcs {
                        let id = tc["id"].as_str().unwrap_or_default().to_string();
                        let name = tc["function"]["name"].as_str().unwrap_or_default().to_string();
                        let arguments = tc["function"]["arguments"].as_str().unwrap_or_default().to_string();
                        let tc_sig = tc["thought_signature"]
                            .as_str()
                            .or_else(|| tc["function"]["thought_signature"].as_str())
                            .or_else(|| tc["signature"].as_str())
                            .or_else(|| tc["function"]["signature"].as_str())
                            .or_else(|| tc["extra_content"]["thought_signature"].as_str())
                            .map(|s| s.to_string())
                            .or_else(|| msg_thought_sig.clone());
                        tc_vec.push(ToolCall { id, name, arguments, thought_signature: tc_sig });
                    }
                    if !tc_vec.is_empty() {
                        tool_calls = Some(tc_vec);
                    }
                }
            }
        }

        let prompt_tokens = res_json["usage"]["prompt_tokens"].as_u64().map(|v| v as u32);
        let completion_tokens = res_json["usage"]["completion_tokens"].as_u64().map(|v| v as u32);
        let total_tokens = res_json["usage"]["total_tokens"].as_u64().map(|v| v as u32);

        Ok(ProviderResponse {
            content: response_content,
            tool_calls,
            prompt_tokens,
            completion_tokens,
            total_tokens,
        })
    }
}
