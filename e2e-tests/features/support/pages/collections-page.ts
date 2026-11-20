import { expect, Page } from '@playwright/test';
import { SITE_ID } from '../../../lib/helpers';

/** The admin's Collections (local indexes). */
export class CollectionsPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto(`/admin/?muraAction=cFeed.list&siteid=${SITE_ID}`);
  }

  async createLocalIndex(name: string, options: { sortBy?: string; sortDirection?: string; maxItems?: number } = {}) {
    await this.page.goto(`/admin/?muraAction=cFeed.edit&feedID=&siteid=${SITE_ID}&type=Local`);
    await this.page.locator('input[name=name]').first().fill(name);
    if (options.sortBy) await this.page.locator('select[name=sortBy]').selectOption(options.sortBy);
    if (options.sortDirection) await this.page.locator('select[name=sortDirection]').selectOption(options.sortDirection);
    if (options.maxItems) await this.page.locator('select[name=maxItems]').selectOption(String(options.maxItems));
    await this.page.locator('button.mura-primary, a.mura-primary').filter({ hasText: 'Add' }).first().click();
    await expect(this.page).toHaveURL(/cFeed\.list/);
  }

  async expectListed(name: string) {
    await this.open();
    await expect(this.page.getByText(name, { exact: true })).toBeVisible();
  }
}
