import { expect, Page } from '@playwright/test';
import { SITE_ID, SITE_MANAGER_MODULE } from '../../../lib/helpers';

export class TrashPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto(`/admin/?muraAction=cTrash.list&siteid=${SITE_ID}&moduleid=${SITE_MANAGER_MODULE}`);
  }

  async restore(title: string) {
    await this.open();
    await this.page.getByRole('link', { name: title, exact: true }).first().click();
    await this.page.getByText('Restore Item', { exact: true }).click();
    // Masa may ask for confirmation in a dialog.
    const confirm = this.page.getByRole('button', { name: /^(yes|ok|confirm)$/i });
    if (await confirm.isVisible({ timeout: 2_000 }).catch(() => false)) await confirm.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Empties the site trash, which purges the deleted content and its files. */
  async empty() {
    await this.open();
    const href = await this.page.getByRole('link', { name: 'Empty Trash' }).getAttribute('href');
    expect(href, 'Empty Trash link').toBeTruthy();
    await this.page.goto(new URL(href!, this.page.url()).toString());
    await this.page.waitForLoadState('networkidle');
  }

  async expectContains(title: string) {
    await this.open();
    await expect(this.page.getByRole('link', { name: title, exact: true }).first()).toBeVisible();
  }
}
