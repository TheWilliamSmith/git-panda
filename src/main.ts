import "dotenv/config";
import { getStagedDiff } from "./git/gitStagedDiff";
import { testAnthropicClient } from "./ai/client";
import { analyseCommit } from "./ai/analyseCommit";
import { selectCommitMessage } from "./ui/interactive";
import { createCommit } from "./git/commit";

async function main() {
  try {
    console.log("Using Git Ai Commit");

    const diff = await getStagedDiff();

    console.log("test if we can connect to anthropic");
    const canConnect = await testAnthropicClient();

    if (!canConnect) {
      console.error("Failed to connect to Anthropic API. Exiting.");
      process.exit(1);
    }

    const suggestions = await analyseCommit(diff);

    const selectedMessage = await selectCommitMessage(suggestions);

    await createCommit(selectedMessage);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
  }
}

main();
