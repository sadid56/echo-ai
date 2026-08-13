const getRandomItem = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const LOADER_MESSAGES = {
  thinking: [
    "Thinking, my friend...",
    "Analyzing your request, buddy...",
    "Hmm, let me think about that...",
    "Figuring it out for you, friend...",
    "Pondering the solution...",
    "Just a second, mapping out the plan...",
  ],
  clicking: [
    "🖱️ Clicking that button on the webpage...",
    "🖱️ Clicking a link for you, my friend...",
    "🖱️ Selecting the element, buddy...",
    "🖱️ Clicking page element...",
  ],
  typing: [
    "⌨️ Entering text & searching webpage...",
    "⌨️ Typing search query, my friend...",
    "⌨️ Entering search keywords, buddy...",
    "⌨️ Typing query for you, mate!",
  ],
  scrolling: [
    "📜 Scrolling webpage...",
    "📜 Scanning down the page, buddy...",
    "📜 Checking further down, my friend...",
    "📜 Scrolling to find more information...",
  ],
  navigating: [
    "🌐 Navigating webpage...",
    "🌐 Opening the webpage for you, friend...",
    "🌐 Loading URL, buddy...",
    "🌐 Browsing the web, mate...",
  ],
  screenshot: [
    "📸 Capturing browser screenshot...",
    "📸 Snapping a screenshot of the page, friend...",
    "📸 Saving page snapshot, buddy...",
  ],
  fetch_emails: [
    "📬 Fetching email messages...",
    "📬 Retrieving emails for you, friend...",
    "📬 Checking inbox, buddy...",
    "📬 Scanning your mail server...",
  ],
  list_directory: ["📁 Scanning directory structure...", "📁 Listing folder contents, my friend...", "📁 Checking folder files, buddy..."],
  run_git_action: ["🛠️ Performing Git action...", "🛠️ Running Git version control action, buddy...", "🛠️ Saving git state, friend..."],
  tool_success: ["✅ Processing results...", "✅ Tool completed successfully, friend!", "✅ Got the output, buddy..."],
  tool_error: ["⚠️ Recovering from tool error...", "⚠️ Encountered an issue, self-healing now, friend...", "⚠️ Recovering steps, buddy..."],
  planning: ["🧠 Planning next action...", "🧠 Deciding what to do next, my friend...", "🧠 Figuring out the next step, buddy..."],
  generic_processing: ["Processing request...", "Working on it, my friend...", "Getting things done, buddy..."],
};

const messageCache: Record<string, string> = {};

export const getFriendlyMessage = (category: keyof typeof LOADER_MESSAGES, cacheKey: string): string => {
  const cacheId = `${category}_${cacheKey}`;
  if (messageCache[cacheId]) {
    return messageCache[cacheId];
  }
  const msg = getRandomItem(LOADER_MESSAGES[category]);
  messageCache[cacheId] = msg;
  return msg;
};

export const getToolMessage = (toolName: string, args: any): string => {
  if (toolName === "run_browser_agent" && args.task) {
    return `🌐 Browsing: "${args.task}" for you, my friend...`;
  }
  if (toolName === "execute_command" && args.command) {
    return `💻 Running command: "${args.command}", buddy...`;
  }
  if (toolName === "read_file" && args.path) {
    const filename = args.path.split(/[/\\]/).pop();
    return `📖 Reading file: ${filename}, my friend...`;
  }
  if (toolName === "write_file" && args.path) {
    const filename = args.path.split(/[/\\]/).pop();
    return `✏️ Editing file: ${filename}, buddy...`;
  }
  if (toolName === "list_directory" && args.path) {
    return `📁 Scanning directory: ${args.path}, friend...`;
  }

  // Fallbacks
  if (toolName === "run_browser_agent") return "🌐 Launching browser assistant, buddy...";
  if (toolName === "execute_command") return "💻 Executing terminal command...";
  if (toolName === "read_file") return "📖 Reading file contents, friend...";
  if (toolName === "write_file") return "✏️ Writing modifications to file...";

  return `🛠️ Running tool: ${toolName}...`;
};
