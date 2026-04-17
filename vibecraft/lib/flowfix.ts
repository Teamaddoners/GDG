export type ActionItem = {
  title: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  category: string;
  note: string;
  original: string;
};

export type FlowFixResult = {
  actionItems: ActionItem[];
  taskSummary: string;
  confidence: number;
  timeSavedMinutes: number;
  prompt: string;
  highlightMap: Record<string, boolean>;
};

const priorityKeywords = [
  { label: "Critical", terms: ["urgent", "asap", "immediately", "blocker"] },
  { label: "High", terms: ["today", "by end", "priority", "important"] },
  { label: "Medium", terms: ["soon", "this week", "follow up", "review"] },
  { label: "Low", terms: ["later", "nice to have", "optional", "whenever"] },
];

const categoryKeywords: Record<string, string[]> = {
  "Meeting": ["meet", "sync", "call", "touch base", "standup"],
  "Review": ["review", "audit", "check", "validate"],
  "Write": ["draft", "write", "compose", "prepare"],
  "Fix": ["fix", "bug", "issue", "resolve", "repair"],
  "Plan": ["plan", "roadmap", "strategy", "scope"],
  "Follow-up": ["follow up", "follow-up", "followup"],
};

const actionTriggers = [
  "action", "todo", "task", "follow", "fix", "schedule", "confirm", "decide", "review", "call", "email", "prepare", "plan", "research",
];

function normalizeText(text: string) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function choosePriority(line: string) {
  const normalized = normalizeText(line);
  for (const item of priorityKeywords) {
    if (item.terms.some(term => normalized.includes(term))) {
      return item.label as ActionItem["priority"];
    }
  }

  if (/\bfix\b|\bissue\b|\bbug\b/.test(normalized)) return "High";
  if (/\breview\b|\bfeedback\b|\bconfirm\b/.test(normalized)) return "Medium";
  return "Low";
}

function chooseCategory(line: string) {
  const normalized = normalizeText(line);
  for (const [category, terms] of Object.entries(categoryKeywords)) {
    if (terms.some(term => normalized.includes(term))) {
      return category;
    }
  }
  return "Action";
}

function extractActionTitle(line: string) {
  const cleaned = line
    .replace(/^[-*\d\.\s]+/, "")
    .replace(/\b(action item|todo|task|note):?/i, "")
    .trim();
  if (!cleaned) {
    return line.trim();
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function transformNotes(input: string): FlowFixResult {
  const sourceLines = input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const actionItems: ActionItem[] = [];
  const highlightMap: Record<string, boolean> = {};

  for (const line of sourceLines) {
    const normalized = normalizeText(line);
    const hasTrigger = actionTriggers.some(trigger => normalized.includes(trigger));

    const title = extractActionTitle(line);
    if (hasTrigger || line.length > 30) {
      const item = {
        title,
        priority: choosePriority(line),
        category: chooseCategory(line),
        note: line,
        original: line,
      };
      actionItems.push(item);
      highlightMap[line] = true;
      continue;
    }

    if (/\bdeadline\b|\bby \w+\b|\bnext\b|\btomorrow\b/.test(normalized)) {
      const item = {
        title,
        priority: choosePriority(line),
        category: chooseCategory(line),
        note: line,
        original: line,
      };
      actionItems.push(item);
      highlightMap[line] = true;
    }
  }

  const uniqueKeywords = new Set(
    sourceLines.flatMap(line => line.split(/\s+/).filter(word => word.length > 4))
  ).size;

  const confidence = Math.min(
    98,
    Math.max(68, 70 + actionItems.length * 6 + Math.min(uniqueKeywords, 10))
  );

  const timeSavedMinutes = Math.max(3, actionItems.length * 4 + Math.round(uniqueKeywords / 2));

  const taskSummary = actionItems.length
    ? `Extracted ${actionItems.length} actionable item${actionItems.length === 1 ? "" : "s"}, prioritized for fast execution.`
    : "No clear action items were found; review your notes and add more task signals.";

  const prompt = [
    "Extract structured tasks from messy notes.",
    "Return a list of action items with priority, category, and a short title.",
    "Base decisions on explicit task words and urgency cues.",
    "Show the exact transformations in a before/after style.",
    "Limit output to clean action items; no extra prose.",
  ].join(" \n");

  return {
    actionItems,
    taskSummary,
    confidence,
    timeSavedMinutes,
    prompt,
    highlightMap,
  };
}

export function formatTasksForDisplay(items: ActionItem[]) {
  if (!items.length) {
    return "No structured action items could be created from the input. Try adding more task cues or deadlines.";
  }

  return items
    .map(item => `- [${item.priority}] ${item.title} (${item.category})`)
    .join("\n");
}
