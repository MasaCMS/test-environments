import { expect, Page } from '@playwright/test';
import { join } from 'node:path';
import { slugOf } from './public-site-page';
import { fieldNameOf } from './form-builder-page';

/** A form on a public page, filled in and submitted the way a visitor does it. */
export class PublicFormPage {
  constructor(private readonly page: Page) {}

  private get form() {
    return this.page.locator('form.mura-form').first();
  }

  private container(label: string) {
    return this.form.locator(`#field-${fieldNameOf(label)}-container`);
  }

  async open(pageTitle: string) {
    const response = await this.page.goto(`/index.cfm/${slugOf(pageTitle)}/`);
    expect(response?.status()).toBe(200);
    await expect(this.form).toBeVisible();
  }

  /** Masa's form id, as stored in the response data. */
  async formId(): Promise<string> {
    return this.form.locator('input[name=formid]').inputValue();
  }

  async expectFields(labels: string[]) {
    for (const label of labels) await expect(this.container(label)).toBeVisible();
  }

  async expectRequired(label: string) {
    await expect(this.container(label).locator('ins')).toHaveText('Required');
  }

  async expectChoices(label: string, choices: string[]) {
    const container = this.container(label);
    const select = container.locator('select');
    const shown = (await select.count())
      ? await select.locator('option').allInnerTexts()
      : await container.locator('label.form-check-label').allInnerTexts();
    for (const choice of choices) expect(shown.map((s) => s.trim())).toContain(choice);
  }

  /**
   * Fills in one field. The kind of field decides how: a dropdown or choice group takes the
   * option text (checkboxes: several, comma separated), a file field takes a file from fixtures/.
   */
  async fill(label: string, value: string) {
    const container = this.container(label);
    if (await container.locator('input[type=file]').count()) {
      await container.locator('input[type=file]').setInputFiles(join(__dirname, '../../../fixtures', value));
    } else if (await container.locator('select').count()) {
      await container.locator('select').selectOption({ label: value });
    } else if (await container.locator('input[type=radio]').count()) {
      await container.getByLabel(value, { exact: true }).check();
    } else if (await container.locator('input[type=checkbox]').count()) {
      for (const choice of value.split(',').map((s) => s.trim())) await container.getByLabel(choice, { exact: true }).check();
    } else {
      const input = container.locator('input, textarea').first();
      await input.click();
      await input.fill('');
      await input.pressSequentially(value);
    }
  }

  /**
   * Masa rejects submissions that look like a robot: no mouse movement, no typing, or a form
   * sent within moments of showing. This moves the mouse, presses a key and waits like a person
   * would.
   */
  async submit() {
    // The mouse test samples the position every 250 ms and compares the first two samples,
    // so the mouse has to be somewhere else at the second sample.
    await this.page.mouse.move(300, 300, { steps: 5 });
    await this.page.waitForTimeout(600);
    await this.page.mouse.move(520, 440, { steps: 5 });
    await this.page.waitForTimeout(600);
    // The spam check counts printable keypresses on the page; press one outside any field.
    await this.page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await this.page.keyboard.press('a');
    await this.page.waitForTimeout(3_000);
    await this.form.locator('.mura-form-submit').click();
  }

  async expectSubmitLabel(label: string) {
    await expect(this.form.locator('.mura-form-submit')).toHaveText(label);
  }

  /** Messages the form shows after a failed submission. */
  async errors(): Promise<string[]> {
    // Masa shows a message per field and one for the form as a whole, all as alerts.
    const texts = await this.form.getByRole('alert').allInnerTexts();
    return texts.flatMap((t) => t.split('\n')).map((t) => t.trim()).filter(Boolean);
  }

  async expectError(text: string) {
    await expect.poll(async () => (await this.errors()).join('\n'), { message: `form errors` }).toContain(text);
  }

  async expectNoErrorFor(text: string) {
    expect((await this.errors()).join('\n')).not.toContain(text);
  }

  /** After a good submission the form is replaced by the confirmation message. */
  async expectSubmitted(message?: string) {
    await expect(this.page.locator('form.mura-form')).toHaveCount(0);
    if (message) await expect(this.page.locator('.mura-response-success')).toContainText(message);
  }

  async expectStillShowingForm() {
    await expect(this.form).toBeVisible();
  }
}
