import { initAnthropicClient } from "./client";

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

export async function analyseCommit(diff: string): Promise<CommitSuggestion[]> {
  try {
    const client = initAnthropicClient();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
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

Return ONLY a JSON array.

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
    const start = rawText.indexOf("[");
    const end = rawText.lastIndexOf("]");

    if (start === -1 || end === -1 || start >= end) {
      throw new Error(`No JSON array found in response. Raw output:\n${rawText}`);
    }

    let jsonStr = rawText.slice(start, end + 1);

    jsonStr = jsonStr.replace(/,\s*([\]}])/g, "$1");

    return JSON.parse(jsonStr) as CommitSuggestion[];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze commit: ${message}`);
  }
}
