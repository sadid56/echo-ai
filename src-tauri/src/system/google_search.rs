use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SearchResultItem {
    pub title: String,
    pub link: String,
    pub snippet: String,
}

#[derive(Deserialize, Debug)]
struct GoogleSearchResponse {
    organic: Option<Vec<GoogleSearchResultItem>>,
}

#[derive(Deserialize, Debug)]
struct GoogleSearchResultItem {
    title: Option<String>,
    link: Option<String>,
    snippet: Option<String>,
}

pub async fn search(api_key: &str, _cse_id: &str, query: &str) -> Result<String, String> {
    let api_key_trimmed = api_key.trim();

    if api_key_trimmed.is_empty() {
        return Err(
            "⚠️ Serper.dev API Key is not configured.\n\
             Please go to Control Center -> Google Search in the settings to configure it."
                .to_string(),
        );
    }

    // Call Serper.dev API for Google Search
    let url = "https://google.serper.dev/search";
    let client = reqwest::Client::new();

    let response = client
        .post(url)
        .header("X-API-KEY", api_key_trimmed)
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "q": query
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to send search request to Serper: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let err_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown API error".to_string());
        return Err(format!(
            "Serper.dev API error (Status {}): {}",
            status, err_text
        ));
    }

    let search_res: GoogleSearchResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Serper JSON response: {}", e))?;

    let mut results = Vec::new();
    if let Some(items) = search_res.organic {
        for item in items {
            results.push(SearchResultItem {
                title: item.title.unwrap_or_default(),
                link: item.link.unwrap_or_default(),
                snippet: item.snippet.unwrap_or_default(),
            });
        }
    }

    serde_json::to_string(&results)
        .map_err(|e| format!("Failed to serialize search results: {}", e))
}
