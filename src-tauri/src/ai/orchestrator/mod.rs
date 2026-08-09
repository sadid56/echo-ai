use crate::ai::providers::{AiProvider, Message, Role};
use crate::ai::providers::gemini::GeminiProvider;
use crate::ai::providers::openai::OpenAiProvider;
use crate::ai::providers::claude::ClaudeProvider;
use crate::ai::providers::local::LocalProvider;
use crate::ai::tools;
use crate::utils::config::AppConfig;
use crate::ai::memory::ChatMemory;
use serde_json::json;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub memory: Mutex<ChatMemory>,
}

pub struct Orchestrator;

impl Orchestrator {
    pub async fn process_prompt(
        app: AppHandle,
        state: &AppState,
        prompt: &str,
    ) -> Result<String, String> {
        let (config, system_prompt, active_model) = {
            let conf = state.config.lock().unwrap();
            (conf.clone(), conf.system_prompt.clone(), conf.active_model.clone())
        };

        // Initialize system prompt in memory if memory is empty
        {
            let mut mem = state.memory.lock().unwrap();
            if mem.get_messages().is_empty() {
                mem.set_system_prompt(system_prompt);
            }
        }

        let log_msg = format!("[Orchestrator] Starting pipeline with model: {}", active_model);
        let _ = app.emit("sidecar-log", log_msg);

        let mut current_prompt = prompt.to_string();
        let mut loop_count = 0;
        const MAX_LOOPS: usize = 5;

        loop {
            loop_count += 1;
            if loop_count > MAX_LOOPS {
                let err_msg = "Maximum tool execution loops reached (5). Stopping to prevent infinite execution.".to_string();
                let _ = app.emit("sidecar-log", format!("[Orchestrator Err] {}", err_msg));
                return Err(err_msg);
            }

            // Get current message history from state
            let history = {
                let mem = state.memory.lock().unwrap();
                mem.get_messages().to_vec()
            };

            let available_tools = tools::get_available_tools();

            let log_msg = format!("[Orchestrator] Requesting completion from AI provider (Iteration {})...", loop_count);
            let _ = app.emit("sidecar-log", log_msg);

            // Directly dispatch based on the model without dyn traits
            let response = match active_model.as_str() {
                "Gemini" => {
                    let key = config.api_keys.gemini.clone();
                    if key.is_empty() { return Err("Gemini API key is empty.".to_string()); }
                    GeminiProvider.generate_response(&current_prompt, &history, &available_tools, &key).await?
                }
                "OpenAI" => {
                    let key = config.api_keys.openai.clone();
                    if key.is_empty() { return Err("OpenAI API key is empty.".to_string()); }
                    OpenAiProvider.generate_response(&current_prompt, &history, &available_tools, &key).await?
                }
                "Claude" => {
                    let key = config.api_keys.claude.clone();
                    if key.is_empty() { return Err("Claude API key is empty.".to_string()); }
                    ClaudeProvider.generate_response(&current_prompt, &history, &available_tools, &key).await?
                }
                "Local" | _ => {
                    let url = config.api_keys.local_url.clone();
                    let model = config.api_keys.local_model.clone();
                    let payload = format!("{}|{}", url, model);
                    LocalProvider.generate_response(&current_prompt, &history, &available_tools, &payload).await?
                }
            };

            // Clear current prompt so it isn't appended in subsequent loops
            current_prompt.clear();

            // Store user prompt in history on the first iteration
            if loop_count == 1 && !prompt.is_empty() {
                let mut mem = state.memory.lock().unwrap();
                mem.add_message(Message {
                    role: Role::User,
                    content: prompt.to_string(),
                    name: None,
                    tool_calls: None,
                });
            }

            // Store provider response in history
            {
                let mut mem = state.memory.lock().unwrap();
                mem.add_message(Message {
                    role: Role::Assistant,
                    content: response.content.clone().unwrap_or_default(),
                    name: None,
                    tool_calls: response.tool_calls.clone(),
                });
            }

            // Log response contents
            if let Some(ref text) = response.content {
                let log_msg = format!("[AI Response] {}", text);
                let _ = app.emit("sidecar-log", log_msg);
            }

            // If model made tool calls, execute them and feed results back
            if let Some(tool_calls) = response.tool_calls {
                let log_msg = format!("[Orchestrator] Model requested {} tool call(s). Running them...", tool_calls.len());
                let _ = app.emit("sidecar-log", log_msg);

                for tc in tool_calls {
                    let tool_result = match tools::execute_tool(app.clone(), &tc.name, &tc.arguments).await {
                        Ok(res) => {
                            let log_ok = format!("[Tool Success] '{}' output captured.", tc.name);
                            let _ = app.emit("sidecar-log", log_ok);
                            res
                        }
                        Err(err) => {
                            let log_err = format!("[Tool Error] '{}' failed: {}", tc.name, err);
                            let _ = app.emit("sidecar-log", log_err);
                            json!({ "status": "error", "message": err }).to_string()
                        }
                    };

                    // Add tool response to memory
                    {
                        let mut mem = state.memory.lock().unwrap();
                        mem.add_message(Message {
                            role: Role::Tool,
                            content: tool_result,
                            name: Some(tc.id.clone()), // OpenAI maps this to tool_call_id
                            tool_calls: None,
                        });
                    }
                }

                // Continue loop to feed tool outputs back to AI provider
                continue;
            }

            // If there are no tool calls, this is our final response
            return Ok(response.content.unwrap_or_else(|| "No text response generated.".to_string()));
        }
    }
}
