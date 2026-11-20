import { expect, Page } from '@playwright/test';
import { HOME_CONTENT_ID, SITE_ID, SITE_MANAGER_MODULE } from '../../../lib/helpers';

/** A browser session of another user, separate from the administrator's. */
export class AdminSession {
  constructor(readonly page: Page) {}

  async login(username: string, password: string) {
    await this.page.goto('/admin/');
    await this.page.locator('#username').fill(username);
    await this.page.locator('#password').fill(password);
    await this.page.locator('#loginForm').getByRole('button').first().click();
    await this.page.waitForLoadState('load');
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL(/muraAction=(?!clogin|cLogin)/);
    await expect(this.page.locator('#loginForm')).toHaveCount(0);
  }

  async expectLoginRejected() {
    await expect(this.page.getByText('No account was found with the provided username and password.')).toBeVisible();
  }

  async openSiteManager(parentId = HOME_CONTENT_ID) {
    await this.page.goto(
      `/admin/?muraAction=cArch.list&siteid=${SITE_ID}&moduleid=${SITE_MANAGER_MODULE}&topid=${parentId}`,
    );
  }

  async expectNoAccessToSiteManager() {
    await this.openSiteManager();
    await expect(this.page).toHaveURL(/cMessage\.noaccess/);
  }

  /** The Site Manager fills its tree after the page has loaded; the column headings show it is done. */
  private async waitForContentTree() {
    await expect(this.page.getByText('Updated', { exact: true }).first()).toBeVisible();
  }

  /** Titles of the content this user sees in the Site Manager under a parent. */
  async visibleContent(parentId = HOME_CONTENT_ID): Promise<string[]> {
    await this.openSiteManager(parentId);
    await this.waitForContentTree();
    const titles = await this.page.locator('a[href*="cArch.edit"]').allInnerTexts();
    return titles.map((t) => t.trim()).filter(Boolean);
  }

  /** Whether the content can be opened for editing by this user. */
  async canEdit(title: string, parentId = HOME_CONTENT_ID): Promise<boolean> {
    await this.openSiteManager(parentId);
    await this.waitForContentTree();
    const link = this.page.locator('a[href*="cArch.edit"]', { hasText: title }).first();
    if (!(await link.count())) return false;
    await link.click();
    return this.page
      .locator('#mura-content-title-render')
      .waitFor({ timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
  }
}
