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
    let config = {
        let conf = state.config.lock().unwrap();
        conf.clone()
    };

    // Decode base64 audio
    let audio_bytes = STANDARD.decode(audio_base64)
        .map_err(|e| format!("Failed to decode base64 audio: {}", e))?;

    let api_key = config.transcribe_model.api_key.clone();
    let api_endpoint = config.transcribe_model.api_endpoint.clone();
    let model_name = config.transcribe_model.model_name.clone();

    // Determine transcription provider based on endpoint URL
    let is_whisper = api_endpoint.contains("transcriptions") || api_endpoint.contains("openai");

    if is_whisper {
        let is_local = api_endpoint.contains("localhost") || api_endpoint.contains("127.0.0.1");
        if api_key.is_empty() && !is_local {
            return Err("API key is required for Whisper transcription.".to_string());
        }

        // Call Whisper API
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| e.to_string())?;

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
            .text("model", model_name);

        let mut req = client.post(&api_endpoint);
        if !api_key.is_empty() {
            req = req.header("Authorization", format!("Bearer {}", api_key));
        }

        let res = req.multipart(form)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let status = res.status();
        if !status.is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Whisper API error ({}): {}", status, err_text));
        }

        let res_json: Value = res.json().await.map_err(|e| e.to_string())?;
        let text = res_json["text"].as_str()
            .ok_or_else(|| "No text field returned from Whisper API".to_string())?;

        Ok(text.to_string())
    } else {
        if api_key.is_empty() {
            return Err("API key is required for Gemini transcription.".to_string());
        }

        let url = if api_endpoint.contains("key=") {
            api_endpoint
        } else if api_endpoint.contains('?') {
            format!("{}&key={}", api_endpoint, api_key)
        } else {
            format!("{}?key={}", api_endpoint, api_key)
        };

        let actual_mime = if mime_type.is_empty() { "audio/webm" } else { mime_type };

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
