import { expect, Page } from '@playwright/test';

export interface SmtpSettings {
  /** Mail server host name; empty for none. */
  host: string;
  port: string;
  username?: string;
  password?: string;
  tls?: boolean;
  ssl?: boolean;
}

// What a fresh site has.
const DEFAULTS = { from: 'example@localhost.com', host: '', port: '25' };

/** Site Settings > Email: the mail server of the site, and the "From" address of its email. */
export class EmailSettingsPage {
  /** Set when a scenario changed the email settings, so that they are put back afterwards. */
  touched = false;
  /** What the dialog said the last time the connection was tested. */
  lastTestResult = '';

  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/admin/?muraAction=cSettings.editSite&siteid=default');
    await this.page.locator('a[href="#tabEmail"]').click();
    await expect(this.page.locator('input[name=MailServerIP]')).toBeVisible();
  }

  // Masa styles its radio buttons; clicking the input in the page is the reliable way.
  private async choose(name: string, value: string) {
    await this.page.locator(`input[name=${name}][value="${value}"]`).evaluate((el: HTMLInputElement) => el.click());
  }

  async useServer(settings: SmtpSettings) {
    this.touched = true;
    await this.choose('useDefaultSMTPServer', '0');
    await this.page.locator('input[name=MailServerIP]').fill(settings.host);
    await this.page.locator('input[name=MailServerSMTPPort]').fill(settings.port);
    await this.page.locator('input[name=MailServerUserName]').fill(settings.username ?? '');
    await this.page.locator('input[name=MailServerPassword]').fill(settings.password ?? '');
    await this.choose('mailServerTLS', String(settings.tls ?? false));
    await this.choose('mailServerSSL', String(settings.ssl ?? false));
  }

  async setFromAddress(address: string) {
    this.touched = true;
    await this.page.locator('input[name=contact]').fill(address);
  }

  async save() {
    await this.page.getByRole('button', { name: /Save Settings/ }).click();
    await expect(this.page).toHaveURL(/cSettings\.list/);
  }

  /** Presses Test Email Settings and returns what the dialog says. */
  async testConnection(): Promise<string> {
    await this.page.getByText('Test Email Settings').click();
    const answer = this.page.getByText(/Your email settings are valid|Error: /).first();
    await expect(answer).toBeVisible({ timeout: 30_000 });
    // The dialog's text is in sibling paragraphs: take the whole box.
    this.lastTestResult = (await answer.locator('xpath=..').innerText()).replace(/\s+/g, ' ');
    return this.lastTestResult;
  }

  async current(): Promise<SmtpSettings & { useDefault: boolean; from: string }> {
    return {
      useDefault: (await this.page.locator('input[name=useDefaultSMTPServer]:checked').inputValue()) === '1',
      host: await this.page.locator('input[name=MailServerIP]').inputValue(),
      port: await this.page.locator('input[name=MailServerSMTPPort]').inputValue(),
      username: await this.page.locator('input[name=MailServerUserName]').inputValue(),
      tls: (await this.page.locator('input[name=mailServerTLS]:checked').inputValue()) === 'true',
      ssl: (await this.page.locator('input[name=mailServerSSL]:checked').inputValue()) === 'true',
      from: await this.page.locator('input[name=contact]').inputValue(),
    };
  }

  /** Puts the email settings of a fresh site back. */
  async restoreDefaults() {
    await this.open();
    await this.choose('useDefaultSMTPServer', '1');
    await this.page.locator('input[name=MailServerIP]').fill(DEFAULTS.host);
    await this.page.locator('input[name=MailServerSMTPPort]').fill(DEFAULTS.port);
    await this.page.locator('input[name=MailServerUserName]').fill('');
    await this.page.locator('input[name=MailServerPassword]').fill('');
    await this.choose('mailServerTLS', 'false');
    await this.choose('mailServerSSL', 'false');
    await this.page.locator('input[name=contact]').fill(DEFAULTS.from);
    await this.save();
  }
}
