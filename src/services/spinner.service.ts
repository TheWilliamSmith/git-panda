import ora, { Ora } from "ora";

const G = "\x1b[32m"; // green
const R = "\x1b[31m"; // red
const B = "\x1b[34m"; // blue
const C = "\x1b[36m"; // cyan
const D = "\x1b[90m"; // dim gray
const X = "\x1b[0m"; // reset

class SpinnerService {
  private spinner: Ora | null = null;

  start(text: string): void {
    this.spinner = ora({
      text: `${D}${text}${X}`,
      spinner: {
        interval: 700,
        frames: [`  ${B}✦${X}`, `  ${C}✦${X}`],
      },
    }).start();
  }

  succeed(text?: string): void {
    if (this.spinner) {
      this.spinner.stopAndPersist({
        symbol: `  ${G}✓${X}`,
        text: text ? `${D}${text}${X}` : "",
      });
      this.spinner = null;
    }
  }

  fail(text?: string): void {
    if (this.spinner) {
      this.spinner.stopAndPersist({
        symbol: `  ${R}✗${X}`,
        text: text ? `${R}${text}${X}` : "",
      });
      this.spinner = null;
    }
  }

  update(text: string): void {
    if (this.spinner) {
      this.spinner.text = `${D}${text}${X}`;
    }
  }

  info(text: string): void {
    process.stdout.write(`  ${B}✦${X} ${D}${text}${X}\n`);
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}

export const spinner = new SpinnerService();
