# GLM Adapter for Python Vision Scraper
def format_vision_request(query: str, raw_text: str) -> str:
    """
    Format request specifically optimized for GLM's instruction-following and page extraction flow.
    """
    return f"GLM Web-Agent Instruction: Extract the information relevant to '{query}' from the raw page text below and return the structured answer cleanly.\n\n{raw_text}"
