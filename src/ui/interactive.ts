import inquirer from "inquirer";
import { CommitSuggestion } from "../ai/analyseCommit";

export async function selectCommitMessage(suggestions: CommitSuggestion[]): Promise<string> {
  const choices = suggestions.map((s) => ({
    name: `${s.message}\n  ${s.description ? `→ ${s.description}` : ""}`,
    value: s.message,
    short: s.message,
  }));

  const { selected } = await inquirer.prompt([
    {
      type: "rawlist",
      name: "selected",
      message: "Select a commit message:",
      choices,
      pageSize: 10,
    },
  ]);

  const { shouldEdit } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldEdit",
      message: "Do you want to edit this message?",
      default: false,
    },
  ]);

  if (shouldEdit) {
    const { editedMessage } = await inquirer.prompt([
      {
        type: "input",
        name: "editedMessage",
        message: "Edit the message:",
        default: selected,
      },
    ]);
    return editedMessage;
  }

  return selected;
}
