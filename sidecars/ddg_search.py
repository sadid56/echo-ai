import sys
import json
from ddgs import DDGS

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing query argument"}))
        sys.exit(1)
    
    query = sys.argv[1]
    try:
        results = []
        with DDGS() as ddgs:
            # Fetch up to 8 search results
            for r in ddgs.text(query, max_results=8):
                results.append({
                    "title": r.get("title", ""),
                    "link": r.get("href", ""),
                    "snippet": r.get("body", "")
                })
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
