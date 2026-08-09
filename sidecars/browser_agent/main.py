import sys
import json
import argparse
from agent.runner import BrowserRunner

def main():
    parser = argparse.ArgumentParser(description="Python Web Automation Agent Sidecar")
    parser.add_argument("--url", required=True, help="Initial URL to scrape")
    parser.add_argument("--query", required=True, help="Query parameter to find")
    args = parser.parse_args()

    runner = BrowserRunner()
    
    # Execute browser crawling/scraping
    result = runner.run(args.url, args.query)
    
    # Output the final JSON string to stdout
    print(json.dumps(result))
    sys.stdout.flush()

if __name__ == "__main__":
    main()
