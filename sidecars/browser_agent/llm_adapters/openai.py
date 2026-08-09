# OpenAI Adapter for Python Vision Scraper
def format_vision_request(query: str, raw_text: str) -> str:
    """
    Format request specifically optimized for OpenAI's system prompt structures.
    """
    return f"OpenAI Web-Agent Instruction: Match '{query}' from raw page text:\n\n{raw_text}"
