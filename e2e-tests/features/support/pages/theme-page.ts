import { expect, Page } from '@playwright/test';

/** Themes in the admin: Site Settings > Basic > Theme. */
export class ThemePage {
  /** Set when a scenario touched the theme, so that the default theme is restored afterwards. */
  touched = false;

  constructor(private readonly page: Page) {}

  /** Masa finds new theme folders when the application reloads. */
  async reloadApplication() {
    await this.page.goto('/?appreload=appreload', { timeout: 120_000 });
    await expect(this.page.locator('body')).toBeVisible();
  }

  private async openSiteSettings() {
    await this.page.goto('/admin/?muraAction=cSettings.editSite&siteid=default');
    await expect(this.page.locator('select[name=theme]')).toBeAttached();
  }

  async offeredThemes(): Promise<string[]> {
    await this.openSiteSettings();
    return this.page.locator('select[name=theme] option').allInnerTexts();
  }

  async currentTheme(): Promise<string> {
    await this.openSiteSettings();
    return this.page.locator('select[name=theme]').inputValue();
  }

  async select(theme: string) {
    this.touched = true;
    await this.openSiteSettings();
    await this.page.locator('select[name=theme]').selectOption(theme);
    await this.page.getByRole('button', { name: /Save Settings/ }).click();
    await expect(this.page).toHaveURL(/cSettings\.list/);
  }

  /** The templates the site's theme offers for a page, in the Layout tab of the editor. */
  async offeredTemplates(): Promise<string[]> {
    await this.page.goto(
      `/admin/?muraAction=cArch.edit&type=Page&subtype=Default&siteid=default` +
        `&moduleid=00000000000000000000000000000000000&parentid=00000000000000000000000000000000001&contentid=&startrow=1`,
    );
    await this.page.locator('#mura-content-title-render').waitFor();
    return (await this.page.locator('select[name=template] option').allInnerTexts()).map((t) => t.trim());
  }
}
