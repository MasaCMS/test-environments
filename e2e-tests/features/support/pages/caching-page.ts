import { expect, Page } from '@playwright/test';

/** Site Settings > Basic: site caching, and the application reload that clears every cache. */
export class CachingPage {
  /** Set when a scenario switched caching on, so that it is switched off again afterwards. */
  touched = false;

  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/admin/?muraAction=cSettings.editSite&siteid=default');
    await expect(this.page.locator('input[name=cache]').first()).toBeAttached();
  }

  // Masa styles its radio buttons; clicking the input in the page is the reliable way.
  async setCaching(on: boolean) {
    this.touched = true;
    await this.open();
    await this.page.locator(`input[name=cache][value="${on ? 1 : 0}"]`).evaluate((el: HTMLInputElement) => el.click());
    await this.page.getByRole('button', { name: /Save Settings/ }).click();
    await expect(this.page).toHaveURL(/cSettings\.list/);
  }

  async cachingIsOn(): Promise<boolean> {
    await this.open();
    return (await this.page.locator('input[name=cache]:checked').inputValue()) === '1';
  }

  /** The warning the admin shows while caching is off. */
  async expectOffWarning(shown: boolean) {
    await this.page.goto('/admin/?muraAction=cSettings.editSite&siteid=default');
    const warning = this.page.getByText('Caching for this site is currently not enabled');
    await (shown ? expect(warning).toBeVisible() : expect(warning).toHaveCount(0));
  }

  /** Reloads the application from the "Reload Application" link of the admin menu. */
  async reloadFromMenu() {
    await this.page.goto('/admin/');
    await this.page.getByRole('link', { name: 'Reload Application' }).first().evaluate((a: HTMLAnchorElement) => a.click());
    // Masa asks for confirmation in a dialog.
    await this.page.getByRole('button', { name: /^(yes|ok|confirm)$/i }).click({ timeout: 5_000 }).catch(() => {});
    await this.page.waitForURL(/admin/, { timeout: 120_000 });
    await expect(this.page.locator('body')).toBeVisible();
  }

  /** Reloads the application with the URL parameter. */
  async reloadFromUrl() {
    await this.page.goto('/admin/?appreload&reload=appreload', { timeout: 120_000 });
    await expect(this.page.locator('body')).toBeVisible();
  }
}
