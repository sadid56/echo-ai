use crate::ai::orchestrator::AppState;
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;
use base64::{Engine as _, engine::general_purpose::STANDARD};

pub async fn transcribe(
    state: &AppState,
    audio_base64: &str,
    mime_type: &str,
) -> Result<String, String> {
    let (config, active_model) = {
        let conf = state.config.lock().unwrap();
        (conf.clone(), conf.active_model.clone())
    };

    // Decode base64 audio
    let audio_bytes = STANDARD.decode(audio_base64)
        .map_err(|e| format!("Failed to decode base64 audio: {}", e))?;

    // Determine transcription provider based on active model and available keys
    if active_model == "OpenAI" || (!config.api_keys.openai.is_empty() && active_model != "Gemini") {
        let api_key = config.api_keys.openai.clone();
        if api_key.is_empty() {
            return Err("OpenAI API key is required for transcription.".to_string());
        }

        // Call OpenAI Whisper API
        let url = "https://api.openai.com/v1/audio/transcriptions";
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| e.to_string())?;

        // Determine file name/extension from mime type
        let ext = if mime_type.contains("wav") {
            "wav"
        } else if mime_type.contains("mp3") {
            "mp3"
        } else if mime_type.contains("m4a") {
            "m4a"
        } else {
            "webm"
        };
        let file_name = format!("audio.{}", ext);
        let actual_mime = if mime_type.is_empty() { "audio/webm" } else { mime_type };

        let part = reqwest::multipart::Part::bytes(audio_bytes)
            .file_name(file_name)
            .mime_str(actual_mime)
            .map_err(|e| e.to_string())?;

        let form = reqwest::multipart::Form::new()
            .part("file", part)
            .text("model", "whisper-1");

        let res = client.post(url)
            .header("Authorization", format!("Bearer {}", api_key))
            .multipart(form)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let status = res.status();
        if !status.is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("OpenAI Whisper API error ({}): {}", status, err_text));
        }

        let res_json: Value = res.json().await.map_err(|e| e.to_string())?;
        let text = res_json["text"].as_str()
            .ok_or_else(|| "No text field returned from Whisper API".to_string())?;

        Ok(text.to_string())
    } else {
        // Fallback to Gemini 1.5 Flash
        let api_key = config.api_keys.gemini.clone();
        if api_key.is_empty() {
            return Err("Either OpenAI API key (for Whisper) or Gemini API key (for Gemini 1.5 Flash) is required for transcription.".to_string());
        }

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={}",
            api_key
        );

        let actual_mime = if mime_type.is_empty() { "audio/webm" } else { mime_type };

        // Gemini expects base64 representation of audio in the inlineData payload
        let body = json!({
            "contents": [{
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": actual_mime,
                            "data": audio_base64
                        }
                    },
                    {
                        "text": "Transcribe the audio accurately. Do not add any explanation, intro, or outro text, just return the transcription."
                    }
                ]
            }]
        });

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
        
        let mut transcription = String::new();
        if let Some(candidates) = res_json["candidates"].as_array() {
            if let Some(candidate) = candidates.first() {
                if let Some(content_parts) = candidate["content"]["parts"].as_array() {
                    for part in content_parts {
                        if let Some(text) = part["text"].as_str() {
                            transcription.push_str(text);
                        }
                    }
                }
            }
        }

        let trimmed = transcription.trim();
        if trimmed.is_empty() {
            return Err("Gemini did not generate a transcription.".to_string());
        }

        Ok(trimmed.to_string())
    }
}
