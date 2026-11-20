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

  /** Finds a content item in the list under `parentId` and returns its edit link. */
  async editLinkOf(title: string, parentId = HOME_CONTENT_ID): Promise<string> {
    await this.page.goto(
      `/admin/?muraAction=cArch.list&siteid=${SITE_ID}&moduleid=${SITE_MANAGER_MODULE}&topid=${parentId}`,
    );
    const href = await this.page.locator('a[href*="cArch.edit"]', { hasText: title }).first().getAttribute('href');
    expect(href, `edit link for "${title}"`).toBeTruthy();
    return href!;
  }

  async contentIdOf(title: string, parentId = HOME_CONTENT_ID): Promise<string> {
    const href = await this.editLinkOf(title, parentId);
    const contentId = href.match(/contentid=([0-9A-F-]+)/i)?.[1];
    expect(contentId, `content ID for "${title}"`).toBeTruthy();
    return contentId!;
  }

  /** Opens the editor on the current version of existing content. */
  async openEditor(title: string, parentId = HOME_CONTENT_ID) {
    const href = await this.editLinkOf(title, parentId);
    await this.page.goto(new URL(href, this.page.url()).toString());
    await this.page.locator('#mura-content-title-render').waitFor();
    await this.page.waitForFunction(() => (window as any).CKEDITOR?.instances?.body?.status === 'ready');
  }

  /** Opens the version history of existing content. */
  async openVersionHistory(title: string, parentId = HOME_CONTENT_ID) {
    const contentId = await this.contentIdOf(title, parentId);
    await this.page.goto(
      `/admin/?muraAction=cArch.hist&contentid=${contentId}&type=Page&siteid=${SITE_ID}` +
        `&moduleid=${SITE_MANAGER_MODULE}&parentid=${parentId}&topid=${parentId}&startrow=1`,
    );
    await expect(this.page.getByText('Version History').first()).toBeVisible();
  }

  /** Statuses of all versions listed in the open version history, newest first. */
  async versionStatuses(): Promise<string[]> {
    const rows = await this.page.locator('table tr').allInnerTexts();
    return rows.map((r) => r.match(/\b(Published|Archived|Draft)\b/)?.[1]).filter((s): s is string => !!s);
  }

  /** Opens an archived version for editing from the open version history. */
  async editArchivedVersion() {
    const row = this.page.locator('table tr', { hasText: 'Archived' }).first();
    await row.locator('a[href*="cArch.edit"][href*="contenthistid"]:visible').first().click();
    await this.page.locator('#mura-content-title-render').waitFor();
    await this.page.waitForFunction(() => (window as any).CKEDITOR?.instances?.body?.status === 'ready');
  }

  /** Deletes content (moves it to the trash) through its row's delete link. */
  async deleteContent(title: string) {
    const contentId = await this.contentIdOf(title);
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
