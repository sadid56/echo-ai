const getRandomItem = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const LOADER_MESSAGES = {
  thinking: [
    "Thinking...",
    "Analyzing your request...",
    "Pondering the solution...",
    "Mapping out the plan...",
  ],
  clicking: [
    "🖱️ Clicking page element...",
    "🖱️ Selecting page element...",
    "🖱️ Performing click action...",
  ],
  typing: [
    "⌨️ Entering text...",
    "⌨️ Entering search keywords...",
    "⌨️ Typing query...",
  ],
  scrolling: [
    "📜 Scrolling page...",
    "📜 Scanning page content...",
    "📜 Scrolling to find information...",
  ],
  navigating: [
    "🌐 Navigating to website...",
    "🌐 Opening page...",
    "🌐 Loading URL...",
  ],
  screenshot: [
    "📸 Capturing browser screenshot...",
    "📸 Snapping a screenshot of the page...",
    "📸 Saving page snapshot...",
  ],
  fetch_emails: [
    "📬 Fetching email messages...",
    "📬 Checking inbox...",
    "📬 Scanning mail server...",
  ],
  list_directory: [
    "📁 Scanning directory structure...",
    "📁 Listing folder contents...",
    "📁 Checking folder files...",
  ],
  run_git_action: [
    "🛠️ Performing Git action...",
    "🛠️ Executing Git action...",
    "🛠️ Saving Git changes...",
  ],
  tool_success: [
    "✅ Processing results...",
    "✅ Tool completed successfully.",
    "✅ Tool execution complete.",
  ],
  tool_error: [
    "⚠️ Recovering from error...",
    "⚠️ Encountered an issue, self-healing...",
    "⚠️ Recovering execution...",
  ],
  planning: [
    "🧠 Planning next action...",
    "🧠 Deciding next action...",
    "🧠 Planning next steps...",
  ],
  generic_processing: [
    "Processing request...",
    "Working on it...",
  ],
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
    return `🌐 Browsing: "${args.task}"...`;
  }
  if (toolName === "execute_command" && args.command) {
    return `💻 Running command: "${args.command}"...`;
  }
  if (toolName === "read_file" && args.path) {
    const filename = args.path.split(/[/\\]/).pop();
    return `📖 Reading file: ${filename}...`;
  }
  if (toolName === "write_file" && args.path) {
    const filename = args.path.split(/[/\\]/).pop();
    return `✏️ Editing file: ${filename}...`;
  }
  if (toolName === "list_directory" && args.path) {
    return `📁 Scanning directory: ${args.path}...`;
  }

  // Fallbacks
  if (toolName === "run_browser_agent") return "🌐 Launching browser assistant...";
  if (toolName === "execute_command") return "💻 Executing terminal command...";
  if (toolName === "read_file") return "📖 Reading file contents...";
  if (toolName === "write_file") return "✏️ Writing modifications to file...";

  return `🛠️ Running tool: ${toolName}...`;
};
