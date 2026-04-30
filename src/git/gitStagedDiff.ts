import { simpleGit } from "simple-git";
import { spinner } from "../services/spinner.service";

const git = simpleGit();

export async function getStagedDiff(): Promise<string> {
  try {
    spinner.start("Checking git repository...");
    const isRepo = await git.checkIsRepo();

    if (!isRepo) {
      spinner.fail("Not a git repository");
      throw new Error("Not a git repository");
    }

    spinner.update("Staging changes...");
    await git.add("./*");

    spinner.update("Retrieving staged diff...");
    const diff = await git.diff(["--staged"]);

    if (!diff || diff.trim().length === 0) {
      spinner.fail("No staged changes found");
      throw new Error("No staged changes found");
    }

    spinner.succeed("Changes retrieved successfully");
    return diff;
  } catch (error: unknown) {
    spinner.fail();
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get staged diff: ${message}`);
  }
}
