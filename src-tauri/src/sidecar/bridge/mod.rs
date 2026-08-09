use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SidecarRequest {
    pub url: String,
    pub query: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SidecarResponse {
    pub success: bool,
    pub data: String,
    pub error: Option<String>,
}

pub fn format_sidecar_input(url: &str, query: &str) -> String {
    let req = SidecarRequest {
        url: url.to_string(),
        query: query.to_string(),
    };
    serde_json::to_string(&req).unwrap_or_default()
}
