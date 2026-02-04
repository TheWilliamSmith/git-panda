import { Anthropic } from "@anthropic-ai/sdk/client.js";
import * as dotenv from "dotenv";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

dotenv.config();

function getApiKey(): string {
  const configPath = join(homedir(), ".config/git-ai-commit/config.json");

  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    return config.anthropicApiKey;
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  throw new Error("No API key found. Run: git-ai config set-key");
}

export async function initAnthropicClient(): Promise<Anthropic> {
  const apiKey = getApiKey();

  const client = new Anthropic({
    apiKey,
  });

  return client;
}

export async function testAnthropicClient(): Promise<boolean> {
  try {
    const client = await initAnthropicClient();

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: "Hello, how are you?",
        },
      ],
    });

    if (!message || message.content.length === 0) {
      throw new Error("No response from Anthropic API");
    }

    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error initializing Anthropic client: ${message}`);
    return false;
  }
}
