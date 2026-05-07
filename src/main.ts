import { getStagedDiff } from "./git/gitStagedDiff";
import { analyseCommit } from "./ai/analyseCommit";
import { selectCommitMessage, confirmPush } from "./ui/interactive";
import { createCommit, pushCommit } from "./git/commit";
import { setConfig, showConfig } from "./commands/config";
import { spinner } from "./services/spinner.service";

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);

    if (args[0] === "config") {
      if (args[1] === "set-key" && args[2]) {
        setConfig("anthropicApiKey", args[2]);
        process.exit(0);
      }
      if (args[1] === "show") {
        showConfig();
        return;
      }
    }

    console.log("\n🐼 Git Panda - AI-Powered Commit Generator\n");

    const diff = await getStagedDiff();
    const suggestions = await analyseCommit(diff);

    const selectedMessage = await selectCommitMessage(suggestions);

    await createCommit(selectedMessage);

    const wantsPush = await confirmPush();
    if (wantsPush) {
      await pushCommit();
    } else {
      console.log("\n  ⏭️  Push skipped.\n");
    }

    console.log(""); // Final spacing
  } catch (error: unknown) {
    spinner.stop();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Error: ${message}\n`);
    process.exit(1);
  }
}

void main();
