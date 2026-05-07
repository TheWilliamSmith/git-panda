import { initAnthropicClient } from "./client";
import { spinner } from "../services/spinner.service";

export interface CommitSuggestion {
  message: string;
  description: string;
}

interface AnthropicTextContent {
  type: "text";
  text: string;
}

function isTextContent(content: unknown): content is AnthropicTextContent {
  return (
    typeof content === "object" &&
    content !== null &&
    "type" in content &&
    "text" in content &&
    (content as { type: unknown }).type === "text" &&
    typeof (content as { text: unknown }).text === "string"
  );
}

function repairJson(raw: string): string {
  // Pass 1: escape literal control characters inside strings (char-by-char)
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) {
      result += ch;
      escaped = false;
    } else if (ch === "\\") {
      result += ch;
      escaped = true;
    } else if (ch === '"') {
      result += ch;
      inString = !inString;
    } else if (inString && ch === "\n") {
      result += "\\n";
    } else if (inString && ch === "\r") {
      result += "\\r";
    } else if (inString && ch === "\t") {
      result += "\\t";
    } else {
      result += ch;
    }
  }

  // Pass 2: remove trailing commas before ] or }
  return result.replace(/,\s*([\]}])/g, "$1");
}

function extractJsonArray(text: string): string {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");

  if (start === -1 || end === -1 || start >= end) {
    throw new Error(`No JSON array found in response. Raw output:\n${text}`);
  }

  return text.slice(start, end + 1);
}

export async function analyseCommit(
  diff: string,
  filesCount: number,
  linesCount: number
): Promise<CommitSuggestion[]> {
  try {
    const startTime = Date.now();
    const filesLabel = filesCount === 1 ? "file" : "files";
    spinner.start(`Analyzing ${filesCount} changed ${filesLabel} (${linesCount} lines)…`);
    const client = initAnthropicClient();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Analyze this git diff and suggest AT LEAST 5 commit messages following Conventional Commits format.

CRITICAL: Provide multiple options with varying levels of detail and grouping.

Rules:
- Use types: feat, fix, chore, refactor, docs, style, test, perf
- Provide at least 5 different suggestions with varying approaches:
1. One highly grouped message combining most/all changes
2. A few moderately grouped messages
3. Some more specific/atomic suggestions
- Use "and" or commas to combine related changes
- Format: type(scope): add/update/fix X and Y
- Be creative with different scopes and emphasis

Return ONLY a valid JSON array with this exact schema, no markdown, no explanation:
[{ "message": "type(scope): description", "description": "short explanation" }]
Each string value must be on a single line with no special characters.

Git diff:
${diff}`,
        },
      ],
    });

    const firstContent = response.content[0];

    if (!isTextContent(firstContent)) {
      throw new Error("Expected text content from Anthropic API");
    }

    const rawText = firstContent.text;

    let jsonStr: string;
    try {
      jsonStr = repairJson(extractJsonArray(rawText));
    } catch {
      throw new Error(`Could not extract JSON from response. Raw output:\n${rawText}`);
    }

    let raw: unknown;
    try {
      raw = JSON.parse(jsonStr);
    } catch {
      // Last resort: try to recover complete objects from a truncated array
      const objects = [...jsonStr.matchAll(/\{[^{}]*"message"\s*:\s*"[^"]+?"[^{}]*\}/g)].map(
        (m) => JSON.parse(m[0]) as CommitSuggestion
      );
      if (objects.length === 0) {
        throw new Error(`Invalid JSON in response. Raw output:\n${rawText}`);
      }
      raw = objects;
    }

    // Handle array of strings: ["feat: ...", "fix: ..."]
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
      raw = (raw as string[]).map((msg) => ({ message: msg, description: "" }));
    }

    // Normalize: the model sometimes uses different keys (commit, text, title…)
    const CANDIDATE_KEYS = ["message", "commit", "title", "text", "commitMessage"];
    const suggestions: CommitSuggestion[] = (raw as Record<string, unknown>[])
      .map((item) => {
        if (typeof item.message === "string" && item.message.trim())
          return item as unknown as CommitSuggestion;
        for (const key of CANDIDATE_KEYS) {
          if (typeof item[key] === "string" && (item[key] as string).trim()) {
            return {
              message: (item[key] as string).trim(),
              description: String(item.description ?? ""),
            };
          }
        }
        return null;
      })
      .filter((s): s is CommitSuggestion => s !== null && Boolean(s.message?.trim()));

    if (suggestions.length === 0) {
      throw new Error(
        `Could not extract any valid commit messages from response. Raw output:\n${rawText}`
      );
    }
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    spinner.succeed(`Generated ${suggestions.length} commit suggestions`);
    spinner.info(`Provider: claude-haiku-4-5  ·  ${elapsed}s`);
    return suggestions;
  } catch (error: unknown) {
    spinner.fail("Failed to analyze commit");
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze commit: ${message}`);
  }
}
