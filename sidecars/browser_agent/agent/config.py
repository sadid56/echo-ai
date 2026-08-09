import os

class AgentConfig:
    def __init__(self):
        self.user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        self.timeout = 10 # seconds
        self.headless = True
        self.persistent_profile_path = os.path.expanduser("~/.echo-ai/browser-profile")
        
        # Ensure directories exist
        os.makedirs(os.path.dirname(self.persistent_profile_path), exist_ok=True)
