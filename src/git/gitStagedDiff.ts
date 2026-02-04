import { simpleGit } from "simple-git";

const git = simpleGit();

export async function getStagedDiff(): Promise<string> {
  try {
    const isRepo = await git.checkIsRepo();

    if (!isRepo) {
      throw new Error("Not a git repository");
    }

    await git.add("./*");

    const diff = await git.diff(["--staged"]);

    if (!diff || diff.trim().length === 0) {
      throw new Error("No staged changes found");
    }

    return diff;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get staged diff: ${message}`);
  }
}
