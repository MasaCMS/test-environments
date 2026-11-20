import { expect, Page } from '@playwright/test';
import { FORMS_MODULE } from './form-builder-page';

/** Form Data in the admin: the responses a form has collected. */
export class FormDataPage {
  constructor(private readonly page: Page) {}

  private url(formId: string, extra = '') {
    return (
      `/admin/index.cfm?muraAction=cArch.datamanager&contentid=${formId}&siteid=default&moduleid=${FORMS_MODULE}` +
      extra
    );
  }

  async open(formId: string) {
    await this.page.goto(this.url(formId));
    await expect(this.page.getByRole('heading', { name: 'Form Data' })).toBeVisible();
  }

  async expectTotal(count: number) {
    await expect(this.page.getByText(`Total Records Available: ${count}`)).toBeVisible();
  }

  /** Lists the responses. The search window covers all dates, because it starts out as the current minute. */
  async list(formId: string, filter?: { field: string; keywords: string }) {
    const params =
      `&date1=01%2F01%2F2020&hour1=0&minute1=0&date2=12%2F31%2F2099&hour2=23&minute2=59` +
      `&sortBy=Entered&sortDirection=asc&filterBy=${filter?.field ?? ''}&keywords=${encodeURIComponent(filter?.keywords ?? '')}` +
      `&newSearch=1&delete=0`;
    await this.page.goto(this.url(formId, params));
  }

  /** The responses on screen, each as { column: value }. */
  async responses(): Promise<Record<string, string>[]> {
    const table = this.page.locator('table', { has: this.page.locator('th', { hasText: 'Date/Time Entered' }) }).first();
    if (!(await table.count())) return [];
    const headers = (await table.locator('thead th').allInnerTexts()).map((h) => h.trim());
    const rows = await table.locator('tbody tr').all();
    const result: Record<string, string>[] = [];
    for (const row of rows) {
      const cells = (await row.locator('td').allInnerTexts()).map((c) => c.trim());
      result.push(Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ''])));
    }
    return result;
  }

  /** The content of the file attached to the response that contains `value`. */
  async attachmentOf(value: string): Promise<Buffer> {
    const row = this.page.locator('table tbody tr', { hasText: value }).first();
    // The "View" link opens the file with a script: preview('<address of the render API>').
    const onclick = await row.locator('a', { hasText: /^View /i }).first().getAttribute('onclick');
    const address = onclick?.match(/preview\('([^']+)'\)/)?.[1];
    expect(address, 'the response has a link to its attachment').toBeTruthy();
    // Only the path counts: the address names the site's domain, not the port of this test run.
    const { pathname, search } = new URL(address!);
    const response = await this.page.request.get(pathname + search);
    expect(response.status()).toBe(200);
    return response.body();
  }

  async deleteResponseWith(value: string) {
    const row = this.page.locator('table tbody tr', { hasText: value }).first();
    await row.locator('a.show-actions').click();
    await row.locator('li.delete a').click();
    // Masa asks "Delete Response?" in a dialog of its own.
    await this.page.getByRole('button', { name: /^(yes|ok|confirm)$/i }).click();
  }

  /** Searches all dates instead of the current minute that the search form starts with. */
  async searchAllDates() {
    await this.page.locator('input[name=date1]').fill('01/01/2020');
    await this.page.locator('select[name=hour1]').selectOption('0');
    await this.page.locator('select[name=minute1]').selectOption('0');
    await this.page.locator('input[name=date2]').fill('12/31/2099');
    await this.page.locator('select[name=hour2]').selectOption('23');
    await this.page.locator('select[name=minute2]').selectOption('59');
    // Masa remembers the keyword search of the admin session, and the download applies it too.
    await this.page.locator('input[name=keywords]:not(#mura-search-keywords)').fill('');
    // Make sure the values were taken before the search or download reads them.
    await expect(this.page.locator('input[name=date1]')).toHaveValue('01/01/2020');
    await expect(this.page.locator('input[name=date2]')).toHaveValue('12/31/2099');
    await expect(this.page.locator('select[name=hour2]')).toHaveValue('23');
  }

  /** Uses the Download button; returns the CSV text. */
  async downloadCsv(): Promise<string> {
    await this.searchAllDates();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.locator('a, button, input', { hasText: 'Download' }).first().click(),
    ]);
    const { readFileSync } = await import('node:fs');
    return readFileSync((await download.path())!, 'utf8');
  }
}
