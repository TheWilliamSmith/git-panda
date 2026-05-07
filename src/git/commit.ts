import simpleGit from "simple-git";
import { spinner } from "../services/spinner.service";

const git = simpleGit();

export async function createCommit(message: string): Promise<void> {
  try {
    spinner.start("Creating commit...");
    await git.commit(message);
    spinner.succeed(`Commit created!\n   📝 ${message}`);
  } catch (error: unknown) {
    spinner.fail("Failed to create commit");
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create commit: ${errorMessage}`);
  }
}

export async function pushCommit(): Promise<void> {
  try {
    spinner.start("Pushing to remote...");
    await git.push();
    spinner.succeed("Pushed to remote successfully!");
  } catch (error: unknown) {
    spinner.fail("Failed to push");
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to push: ${errorMessage}`);
  }
}

export async function hasUncommittedChanges(): Promise<boolean> {
  const status = await git.status();
  return status.staged.length > 0;
}
