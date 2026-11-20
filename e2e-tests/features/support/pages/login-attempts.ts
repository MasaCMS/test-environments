import { expect, Page } from '@playwright/test';

/** What someone who is not logged in sees when they try the admin login. */
export class LoginAttempts {
  /** The text of the login page after each attempt, by what was tried. */
  readonly answers = new Map<string, string>();
  anonymousPage?: Page;

  async record(label: string, page: Page) {
    const text = await page.locator('body').innerText();
    // The answer is the part of the page about the login; the rest of the page is the same each time.
    const message = text.match(/No account was found[^\n]*|[^\n]*locked[^\n]*|[^\n]*too many[^\n]*/i)?.[0] ?? text;
    this.answers.set(label, message.replace(/\s+/g, ' ').trim());
  }

  expectSameAnswer(first: string, second: string) {
    expect(this.answers.get(first), `answer for ${first}`).toBeTruthy();
    expect(this.answers.get(first)).toBe(this.answers.get(second));
  }
}
