import { initAnthropicClient } from "./client";

export interface CommitSuggestion {
  message: string;
  description: string;
}

export async function analyseCommit(diff: string): Promise<CommitSuggestion[]> {
  try {
    const client = await initAnthropicClient();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Analyze this git diff and suggest 3-5 commit messages following Conventional Commits format.

            Rules:
            - Use types: feat, fix, chore, refactor, docs, style, test, perf
            - Be concise and specific
            - Focus on WHAT changed and WHY
            - Format: type(scope): description

            Return ONLY a JSON array of objects with this format:
            [
                {
                    "message": "feat(docker): add development Makefile",
                    "description": "Simplifies local development setup"
                }
            ]

            Git diff:
            ${diff}`,
        },
      ],
    });

    const content = response.content[0];

    if (content.type !== "text") {
      throw new Error("Expected text response from API");
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const suggestions: CommitSuggestion[] = JSON.parse(jsonMatch[0]) as CommitSuggestion[];
    return suggestions;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyse commit: ${message}`);
  }
}
