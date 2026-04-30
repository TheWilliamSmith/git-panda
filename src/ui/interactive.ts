import inquirer from "inquirer";
import { CommitSuggestion } from "../ai/analyseCommit";

interface SelectedAnswer {
  selected: string;
}

interface ShouldEditAnswer {
  shouldEdit: boolean;
}

interface EditedMessageAnswer {
  editedMessage: string;
}

export async function selectCommitMessage(suggestions: CommitSuggestion[]): Promise<string> {
  const choices = suggestions.map((s) => ({
    name: `${s.message}\n `,
    value: s.message,
    short: s.message,
  }));

  console.log(""); // Add space before the prompt

  const { selected } = await inquirer.prompt<SelectedAnswer>([
    {
      type: "rawlist",
      name: "selected",
      message: "Select a commit message:",
      choices,
      pageSize: 10,
    },
  ]);

  const { shouldEdit } = await inquirer.prompt<ShouldEditAnswer>([
    {
      type: "confirm",
      name: "shouldEdit",
      message: "Do you want to edit this message?",
      default: false,
    },
  ]);

  if (shouldEdit) {
    const { editedMessage } = await inquirer.prompt<EditedMessageAnswer>([
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
