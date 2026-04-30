import ora, { Ora } from "ora";

class SpinnerService {
  private spinner: Ora | null = null;

  start(text: string): void {
    this.spinner = ora({
      text,
      color: "cyan",
      spinner: "dots",
    }).start();
  }

  succeed(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  fail(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  update(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}

export const spinner = new SpinnerService();
