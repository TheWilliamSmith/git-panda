import { getStagedDiff } from "./git/gitStagedDiff";
import { analyseCommit } from "./ai/analyseCommit";
import { selectCommitMessage, confirmPush, UserCancelledError } from "./ui/interactive";
import { createCommit, pushCommit } from "./git/commit";
import { setConfig, showConfig } from "./commands/config";
import { spinner } from "./services/spinner.service";

const G = "\x1b[32m";
const W = "\x1b[97m";
const D = "\x1b[90m";
const X = "\x1b[0m";

// Fake body bullets — placeholder until body generation is added
const FAKE_BULLETS = [
  "Update project structure and related configuration",
  "Refactor core module for better maintainability",
  "Improve error handling and edge cases",
];

function printCommitPreview(message: string): void {
  const match = message.match(/^([a-z]+(?:\([^)]+\))?): (.+)$/);
  console.log("");
  if (match) {
    console.log(`  ${G}${match[1]}:${X} ${W}${match[2]}${X}`);
  } else {
    console.log(`  ${W}${message}${X}`);
  }
  console.log("");
  FAKE_BULLETS.forEach((b) => console.log(`  ${D}- ${b}${X}`));
  console.log("");
}

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

    console.log("");

    const { diff, filesCount, linesCount } = await getStagedDiff();
    const suggestions = await analyseCommit(diff, filesCount, linesCount);

    const selectedMessage = await selectCommitMessage(suggestions);

    printCommitPreview(selectedMessage);

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
    if (error instanceof UserCancelledError) {
      console.log(`\n  \x1b[31m✗\x1b[0m \x1b[90mAborted — no commit was created.\x1b[0m\n`);
      process.exit(0);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n  \x1b[31m✗\x1b[0m \x1b[31m${message}\x1b[0m\n`);
    process.exit(1);
  }
}

void main();
