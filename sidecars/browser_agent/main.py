import sys
import json
import argparse
from agent.runner import BrowserRunner

def main():
    parser = argparse.ArgumentParser(description="Python Web Automation Agent Sidecar")
    # Accept URL/query or a list of steps
    parser.add_argument("--url", default="", help="Initial URL to scrape")
    parser.add_argument("--query", default="", help="Query parameter to find")
    parser.add_argument("--steps", default="", help="JSON string representing step-by-step actions")
    args = parser.parse_args()

    runner = BrowserRunner()
    
    if args.steps:
        try:
            steps_list = json.loads(args.steps)
            result = runner.run_steps(steps_list, args.query, args.url)
        except Exception as json_err:
            runner.log(f"[Err] Failed to parse steps JSON: {json_err}")
            result = {"success": False, "error": f"Invalid steps JSON: {json_err}"}
    else:
        if not args.url:
            result = {"success": False, "error": "Missing initial URL --url or --steps script."}
        else:
            result = runner.run(args.url, args.query)
    
    # Output the final JSON string to stdout if not printed already
    if isinstance(result, dict) and "already_printed" in result:
        pass
    else:
        print(json.dumps(result))
        sys.stdout.flush()

if __name__ == "__main__":
    main()
