use crate::ai::providers::{Message, Role};
use crate::ai::providers::openai_compatible::OpenAiCompatibleProvider;
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

use crate::ai::providers::Attachment;

#[derive(serde::Serialize)]
pub struct OrchestratorResult {
    pub content: String,
    pub tokens_used: u32,
}

impl Orchestrator {
    pub async fn process_prompt(
        app: AppHandle,
        state: &AppState,
        prompt: &str,
        attachments: Option<Vec<Attachment>>,
    ) -> Result<OrchestratorResult, String> {
        let (config, mut system_prompt) = {
            let conf = state.config.lock().unwrap();
            (conf.clone(), conf.system_prompt.clone())
        };

        let interaction_rule = "\n\nYou have full ability to interact with web pages, such as clicking buttons or links, filling out input fields/forms, scrolling, and waiting. If the user asks you to click a button, type text, log in, or interact with any element on a page, you MUST call 'run_browser_agent' and specify the actions inside the 'steps' parameter array. Never claim you cannot interact with pages or buttons directly.";
        let line_number_rule = "\n\nWhen you read files using 'read_file', they will have line numbers prepended (e.g., '   1: code'). When writing/modifying code files using 'write_file', you MUST strip these prepended line numbers and save ONLY the raw code.";
        
        if !system_prompt.contains("interact with web pages") {
            system_prompt.push_str(interaction_rule);
        }
        if !system_prompt.contains("strip these prepended line numbers") {
            system_prompt.push_str(line_number_rule);
        }
        
        let diff_rule = "\n\nWhen showing code changes or answering what changed in a file, you MUST present the differences in a standard Git diff unified format (using '-' for deletions and '+' for additions) indicating exactly which lines changed.";
        if !system_prompt.contains("present the differences in a standard Git diff") {
            system_prompt.push_str(diff_rule);
        }
        
        let local_search_rule = "\n\nIf the user asks you to locate, search for, or find local files, directories, or folders on their system, you MUST call 'execute_command' with a command like 'find /home -type d -name ... 2>/dev/null' or check the current path using 'execute_command' with 'pwd'. Never just write a text tutorial explaining how they can do it themselves.";
        if !system_prompt.contains("locate, search for, or find local files") {
            system_prompt.push_str(local_search_rule);
        }

        let emoji_rule = "\n\nYou MUST always include appropriate emojis in all of your responses to make them friendly and engaging.";
        if !system_prompt.contains("include appropriate emojis") {
            system_prompt.push_str(emoji_rule);
        }

        let engine_name = if config.google_search.engine == "serper" {
            "Google Search (via Serper.dev)"
        } else {
            "DuckDuckGo"
        };
        let active_engine_rule = format!("\n\nYour background web search tool ('google_search') is currently configured to query the {} search engine. When asked what search engine you are currently using, you MUST declare that you are using {}.", engine_name, engine_name);
        system_prompt.push_str(&active_engine_rule);

        // Detect host OS and environment dynamically
        let os_details = match std::env::consts::OS {
            "macos" => {
                let ver = std::process::Command::new("sw_vers")
                    .output()
                    .map(|o| String::from_utf8_lossy(&o.stdout).trim().replace('\n', ", "))
                    .unwrap_or_else(|_| "Apple macOS".to_string());
                format!("Apple macOS ({})", ver)
            },
            "linux" => {
                let ver = std::fs::read_to_string("/etc/os-release")
                    .map(|s| s.lines().find(|l| l.starts_with("PRETTY_NAME=")).map(|l| l.replace("PRETTY_NAME=", "").replace('\"', "")).unwrap_or_default())
                    .unwrap_or_else(|_| "Linux".to_string());
                format!("Linux ({})", ver)
            },
            "windows" => "Microsoft Windows".to_string(),
            other => other.to_string(),
        };
        let os_arch = std::env::consts::ARCH;
        let current_user = std::env::var("USER").or_else(|_| std::env::var("USERNAME")).unwrap_or_else(|_| "user".to_string());
        let home_dir = std::env::var("HOME").or_else(|_| std::env::var("USERPROFILE")).unwrap_or_else(|_| "~".to_string());
        let current_dir = std::env::current_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|_| ".".to_string());

        let system_access_rule = format!(
            "\n\n=== NATIVE OPERATING SYSTEM & ENVIRONMENT ACCESS ===\n\
            You are Echo, running natively as a desktop AI application directly on the user's computer with full system privileges.\n\
            - Host Operating System: {}\n\
            - Architecture: {}\n\
            - Current User: {}\n\
            - User Home Directory: {}\n\
            - Current Working Directory: {}\n\
            \n\
            CRITICAL OPERATING SYSTEM RULES:\n\
            1. NEVER EVER say \"I don't have access to your local machine\", \"I can't check your OS\", \"I cannot see your files\", or \"Run this command yourself in terminal\". You have full native terminal and file system access right now!\n\
            2. If the user asks what OS they are using, computer hardware, CPU, RAM, disk space, battery, network, IP, installed apps, or running processes, you ALREADY have the system details above, or you MUST call 'execute_command' (e.g. 'sw_vers', 'uname -a', 'top', 'df -h', 'ps aux', 'whoami', 'cat', etc.) to inspect it and answer directly with the real facts!\n\
            3. You have unrestricted access to the entire file system on this computer. Use 'list_directory' to list any directory (including home '{}', desktop, downloads, documents, root, or any path), 'read_file' to read any file, and 'write_file' to create or edit files anywhere.\n\
            4. If the user asks to find, create, delete, move, edit, or check any file, or run any script/command, DO IT DIRECTLY using 'execute_command' or the file tools without hesitation. Never refuse or tell the user to do it manually.\n\
            5. Always act as an autonomous, proactive OS assistant who can manage the entire system for the user.",
            os_details, os_arch, current_user, home_dir, current_dir, home_dir
        );
        system_prompt.push_str(&system_access_rule);

        {
            let mut mem = state.memory.lock().unwrap();
            mem.set_system_prompt(system_prompt);
        }

        let log_msg = format!("[Orchestrator] Starting pipeline with model: {} ({})", config.text_model.model_name, config.text_model.provider_name);
        let _ = app.emit("sidecar-log", log_msg);

        let mut current_prompt = prompt.to_string();
        let mut loop_count = 0;
        let mut total_tokens_used: u32 = 0;
        const MAX_LOOPS: usize = 5;

        let mut last_tool_call_signature: Option<(String, String)> = None;

        loop {
            loop_count += 1;
            if loop_count > MAX_LOOPS {
                let err_msg = "I hit a repeated tool loop while processing your request and stopped to avoid an infinite cycle. Please rephrase the task or ask for a smaller step.".to_string();
                let _ = app.emit("sidecar-log", format!("[Orchestrator Err] {}", err_msg));
                return Err(err_msg);
            }

            let history = {
                let mem = state.memory.lock().unwrap();
                mem.get_messages().to_vec()
            };

            let available_tools = tools::get_available_tools();

            let log_msg = format!("[Orchestrator] Requesting completion from AI provider (Iteration {})...", loop_count);
            let _ = app.emit("sidecar-log", log_msg);

            let key = config.text_model.api_key.clone();
            let endpoint = config.text_model.api_endpoint.clone();
            let model = config.text_model.model_name.clone();

            let is_local_ollama = endpoint.contains("localhost") || endpoint.contains("127.0.0.1");
            if key.is_empty() && !is_local_ollama {
                return Err(format!("API key is empty for text provider '{}'. Please configure it in Settings.", config.text_model.provider_name));
            }

            let initial_attachments = if loop_count == 1 {
                attachments.as_ref()
            } else {
                None
            };

            let mut response = OpenAiCompatibleProvider.generate_response(
                &endpoint,
                &key,
                &model,
                &current_prompt,
                &history,
                &available_tools,
                config.text_model.max_tokens,
                initial_attachments,
            ).await?;

            if let Some(toks) = response.total_tokens {
                total_tokens_used += toks;
            }

            if let Some(ref tcs) = response.tool_calls {
                if let Some(first_tc) = tcs.first() {
                    let sig = (first_tc.name.clone(), first_tc.arguments.clone());
                    if let Some(ref last_sig) = last_tool_call_signature {
                        if last_sig == &sig {
                            let _ = app.emit("sidecar-log", "[Orchestrator Warning] Duplicate tool call detected. Breaking loop to prevent infinite execution and summarizing...".to_string());
                            let mut mem = state.memory.lock().unwrap();
                            mem.add_message(Message {
                                role: Role::User,
                                content: "You are repeating the same tool call. Please STOP calling tools and summarize the information you have found in the previous command execution outputs.".to_string(),
                                name: None,
                                tool_calls: None,
                            });
                            loop_count = MAX_LOOPS - 1;
                            current_prompt.clear();
                            response.tool_calls = None;
                            continue;
                        }
                    }
                    last_tool_call_signature = Some(sig);
                }
            }

            current_prompt.clear();

            if loop_count == 1 && !prompt.is_empty() {
                let mut mem = state.memory.lock().unwrap();
                mem.add_message(Message {
                    role: Role::User,
                    content: prompt.to_string(),
                    name: None,
                    tool_calls: None,
                });
            }

            {
                let mut mem = state.memory.lock().unwrap();
                mem.add_message(Message {
                    role: Role::Assistant,
                    content: response.content.clone().unwrap_or_default(),
                    name: None,
                    tool_calls: response.tool_calls.clone(),
                });
            }

            if let Some(ref text) = response.content {
                let log_msg = format!("[AI Response] {}", text);
                let _ = app.emit("sidecar-log", log_msg);
            }

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
                            name: Some(tc.id.clone()), 
                            tool_calls: None,
                        });
                    }
                }

                continue;
            }

            return Ok(OrchestratorResult {
                content: response.content.unwrap_or_else(|| "No text response generated.".to_string()),
                tokens_used: total_tokens_used,
            });
        }
    }
}
