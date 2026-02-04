import simpleGit from "simple-git";

const git = simpleGit();

export async function createCommit(message: string): Promise<void> {
  try {
    await git.commit(message);
    console.log("\n✅ Commit created successfully!");
    console.log(`📝 Message: ${message}`);
  } catch (error: any) {
    throw new Error(`Failed to create commit: ${error.message}`);
  }
}

export async function hasUncommittedChanges(): Promise<boolean> {
  const status = await git.status();
  return status.staged.length > 0;
}
