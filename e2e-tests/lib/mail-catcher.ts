import { APIRequestContext, expect } from '@playwright/test';

/**
 * Mailpit, a mail server that keeps what it receives, for the tests that check email.
 * Start it with: docker compose -f e2e-tests/mail/docker-compose.yml up -d
 * It listens for SMTP on port 1025 and has a web API on port 8025.
 *
 * MAIL_API       address of the web API as the tests see it (default http://localhost:8025)
 * MAIL_SMTP_HOST address of the mail server as the CMS container sees it
 *                (default host.docker.internal, which Docker Desktop provides)
 * MAIL_SMTP_PORT SMTP port (default 1025)
 */
export const MAIL_API = process.env.MAIL_API || 'http://localhost:8025';
export const MAIL_SMTP_HOST = process.env.MAIL_SMTP_HOST || 'host.docker.internal';
export const MAIL_SMTP_PORT = process.env.MAIL_SMTP_PORT || '1025';

export interface CaughtMail {
  id: string;
  from: string;
  to: string[];
  replyTo: string[];
  subject: string;
  text: string;
  html: string;
}

export class MailCatcher {
  constructor(private readonly request: APIRequestContext) {}

  async isRunning(): Promise<boolean> {
    try {
      return (await this.request.get(`${MAIL_API}/api/v1/info`, { timeout: 3_000 })).ok();
    } catch {
      return false;
    }
  }

  async clear() {
    await this.request.delete(`${MAIL_API}/api/v1/messages`);
  }

  async messages(): Promise<CaughtMail[]> {
    const list = await (await this.request.get(`${MAIL_API}/api/v1/messages`)).json();
    const result: CaughtMail[] = [];
    for (const summary of list.messages ?? []) {
      const m = await (await this.request.get(`${MAIL_API}/api/v1/message/${summary.ID}`)).json();
      result.push({
        id: m.ID,
        from: m.From?.Address ?? '',
        to: (m.To ?? []).map((a: { Address: string }) => a.Address),
        replyTo: (m.ReplyTo ?? []).map((a: { Address: string }) => a.Address),
        subject: m.Subject ?? '',
        text: m.Text ?? '',
        html: m.HTML ?? '',
      });
    }
    return result;
  }

  /** Waits until `count` messages have arrived (mail is sent in the background) and returns them. */
  async waitForMessages(count: number): Promise<CaughtMail[]> {
    await expect.poll(async () => (await this.messages()).length, { timeout: 30_000, message: `${count} email(s) arrived` }).toBeGreaterThanOrEqual(count);
    return this.messages();
  }

  /** No message arrives within a few seconds. Mail is sent in the background, so this waits a while. */
  async expectNoMessages(waitMs = 6_000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    expect(await this.messages(), 'no email was sent').toHaveLength(0);
  }
}
