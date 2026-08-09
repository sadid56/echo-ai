# Claude Adapter for Python Vision Scraper
def format_vision_request(query: str, raw_text: str) -> str:
    """
    Format request specifically optimized for Claude's long context window and XML formatting preferences.
    """
    return f"Claude Web-Agent Instruction: Parse information matching query '{query}'.\n<page_text>\n{raw_text}\n</page_text>"
