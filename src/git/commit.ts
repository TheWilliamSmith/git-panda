import simpleGit from "simple-git";
import { spinner } from "../services/spinner.service";

const git = simpleGit();

export async function createCommit(message: string): Promise<void> {
  try {
    spinner.start("Creating commit...");
    await git.commit(message);

    spinner.update("Pushing to remote...");
    await git.push();

    spinner.succeed(`Commit created and pushed successfully!\n   📝 ${message}`);
  } catch (error: unknown) {
    spinner.fail("Failed to create commit");
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create commit: ${errorMessage}`);
  }
}

export async function hasUncommittedChanges(): Promise<boolean> {
  const status = await git.status();
  return status.staged.length > 0;
}
