# Gemini Adapter for Python Vision Scraper
def format_vision_request(query: str, raw_text: str) -> str:
    """
    Format request specifically optimized for Gemini's multimodal and function-calling schemas.
    """
    return f"Gemini Web-Agent Instruction: Find information on '{query}' using the text below:\n\n{raw_text}"
