import { expect, Page } from '@playwright/test';
import { SITE_ID } from '../../../lib/helpers';

export class ChangesetsPage {
  /** Ids Masa gave the change sets made in a scenario, by their real name. */
  private readonly ids = new Map<string, string>();

  constructor(private readonly page: Page) {}

  async openList() {
    await this.page.goto(`/admin/?muraAction=cChangesets.list&siteid=${SITE_ID}`);
  }

  /** Creates a change set. `publishDate` is "MM/DD/YYYY" and makes it a scheduled change set. */
  async create(name: string, options: { publishDate?: string } = {}) {
    await this.page.goto(`/admin/?muraAction=cChangesets.edit&changesetID=&siteid=${SITE_ID}`);
    await this.page.locator('input[name=name]').fill(name);
    if (options.publishDate) {
      // The date and time pickers write into a hidden field; it is set directly.
      await this.page.evaluate((date) => {
        (document.querySelector('#mura-publishDate') as HTMLInputElement).value = `${date} 12:00 AM`;
      }, options.publishDate);
    }
    await this.page.getByRole('button', { name: 'Add' }).first().click();
    await expect(this.page).toHaveURL(/cChangesets\.list/);
    this.ids.set(name, new URL(this.page.url()).searchParams.get('changesetID') ?? '');
  }

  idOf(name: string): string {
    const id = this.ids.get(name);
    if (!id) throw new Error(`The change set "${name}" was not created in this scenario`);
    return id;
  }

  async expectListed(name: string) {
    await this.openList();
    await expect(this.page.getByRole('link', { name, exact: true })).toBeVisible();
  }

  /** The "Date to Publish" shown for a change set in the list. */
  async publishDateInList(name: string): Promise<string> {
    await this.openList();
    const row = this.page.locator('tr', { has: this.page.getByRole('link', { name, exact: true }) });
    return (await row.locator('td').nth(2).innerText()).trim();
  }

  /** In the content editor: saves the content as a draft inside the change set. */
  async saveEditedContentToChangeset(name: string) {
    await this.page.getByRole('button', { name: /Save to Change Set/ }).first().click();
    const row = this.page.locator('#changesetContainer tr', { hasText: name });
    await row.locator('input[type=radio]').check();
    await this.page.getByRole('button', { name: 'Save', exact: true }).last().click();
    await expect(this.page).toHaveURL(/cArch\.list/);
  }

  async openAssignments(name: string) {
    await this.page.goto(`/admin/?muraAction=cChangesets.assignments&changesetID=${this.idOf(name)}&siteid=${SITE_ID}`);
  }

  /** The row of an assignment; Masa shows titles in capitals, so the match ignores case. */
  private assignmentRow(contentTitle: string) {
    return this.page.locator('tr', { hasText: new RegExp(contentTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
  }

  async expectAssigned(name: string, contentTitle: string) {
    await this.openAssignments(name);
    await expect(this.assignmentRow(contentTitle)).toBeVisible();
  }

  async removeAssignment(name: string, contentTitle: string) {
    await this.openAssignments(name);
    const row = this.assignmentRow(contentTitle);
    // The row's actions are in a menu.
    await row.locator('a[href="javascript:;"]').first().click();
    await row.getByRole('link', { name: 'Delete' }).click();
    // Masa asks for confirmation.
    await this.page.getByRole('button', { name: /^(yes|ok|confirm)$/i }).click();
  }

  async expectNotAssigned(name: string, contentTitle: string) {
    await this.openAssignments(name);
    await expect(this.assignmentRow(contentTitle)).toHaveCount(0);
  }

  async publishNow(name: string) {
    await this.page.goto(`/admin/?muraAction=cChangesets.edit&changesetID=${this.idOf(name)}&siteid=${SITE_ID}`);
    await this.page.getByRole('button', { name: /Publish Now/ }).click();
    await this.page.getByRole('button', { name: /^(yes|ok|confirm)$/i }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectPublished(name: string) {
    await this.page.goto(`/admin/?muraAction=cChangesets.edit&changesetID=${this.idOf(name)}&siteid=${SITE_ID}`);
    await expect(this.page.locator('.alert-info')).toBeVisible();
    await expect(this.page.getByRole('button', { name: /Publish Now/ })).toHaveCount(0);
  }

  /** The address of the change set preview of a public path (relative to /index.cfm/). */
  previewPath(name: string, path: string): string {
    return `${path}?changesetID=${this.idOf(name)}`;
  }
}
