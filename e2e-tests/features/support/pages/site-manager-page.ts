import { expect, Page } from '@playwright/test';
import { HOME_CONTENT_ID, SITE_ID, SITE_MANAGER_MODULE, siteManagerUrl } from '../../../lib/helpers';

export class SiteManagerPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto(siteManagerUrl());
  }

  async expectVisible() {
    await expect(this.page).toHaveTitle(/Site Content/);
    await expect(this.page.getByText('Add User')).toBeAttached();
  }

  /** Deletes content (moves it to the trash) through its row's delete link. */
  async deleteContent(title: string) {
    await this.page.goto(
      `/admin/?muraAction=cArch.list&siteid=${SITE_ID}&moduleid=${SITE_MANAGER_MODULE}&topid=${HOME_CONTENT_ID}`,
    );
    // The title link carries the content ID; the delete link sits in a hidden row menu.
    const titleLink = this.page.locator('a[href*="cArch.edit"]', { hasText: title }).first();
    const editHref = await titleLink.getAttribute('href');
    const contentId = editHref?.match(/contentid=([0-9A-F-]+)/i)?.[1];
    expect(contentId, `content ID for "${title}"`).toBeTruthy();
    // The delete link carries the csrf token, so follow it directly.
    const href = await this.page
      .locator(`a[href*="action=deleteall"][href*="contentid=${contentId}"]`)
      .first()
      .getAttribute('href');
    expect(href, `delete link for "${title}"`).toBeTruthy();
    await this.page.goto(new URL(href!, this.page.url()).toString());
    await expect(this.page).toHaveURL(/cArch\.list/);
  }
}
