import inquirer from "inquirer";
import { CommitSuggestion } from "../ai/analyseCommit";

export async function selectCommitMessage(suggestions: CommitSuggestion[]): Promise<string> {
  const choices = suggestions.map((s) => ({
    name: `${s.message}\n  ${s.description ? `→ ${s.description}` : ""}`,
    value: s.message,
    short: s.message,
  }));

  choices.push({
    name: "✏️  Write my own message",
    value: "custom",
    short: "Custom message",
  });

  const { selected } = await inquirer.prompt([
    {
      type: "rawlist",
      name: "selected",
      message: "Select a commit message:",
      choices,
      pageSize: 10,
    },
  ]);

  if (selected === "custom") {
    const { customMessage } = await inquirer.prompt([
      {
        type: "input",
        name: "customMessage",
        message: "Enter your commit message:",
        validate: (input: string) => input.trim().length > 0 || "Message cannot be empty",
      },
    ]);
    return customMessage;
  }

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
