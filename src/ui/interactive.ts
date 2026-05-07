import inquirer from "inquirer";
import * as readline from "readline";
import { CommitSuggestion } from "../ai/analyseCommit";

interface SelectedAnswer {
  selected: string;
}

interface ShouldEditAnswer {
  shouldEdit: boolean;
}

interface ShouldPushAnswer {
  shouldPush: boolean;
}

function editMessageWithReadline(defaultMessage: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`✏️  Edit message: `, (answer) => {
      rl.close();
      resolve(answer || defaultMessage);
    });

    rl.write(defaultMessage);
  });
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
    const editedMessage = await editMessageWithReadline(selected);
    return editedMessage.trim();
  }

  return selected;
}

export async function confirmPush(): Promise<boolean> {
  const { shouldPush } = await inquirer.prompt<ShouldPushAnswer>([
    {
      type: "confirm",
      name: "shouldPush",
      message: "Do you want to push to remote?",
      default: true,
    },
  ]);

  return shouldPush;
}
