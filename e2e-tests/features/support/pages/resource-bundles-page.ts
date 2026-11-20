import { expect, Page } from '@playwright/test';

/** Site Settings > Basic > Locale: the language Masa looks for first in the resource bundles. */
export class ResourceBundlesPage {
  /** Set when a scenario changed the site locale, so that the default locale is put back afterwards. */
  touched = false;

  constructor(private readonly page: Page) {}

  async setSiteLocale(locale: string) {
    this.touched = true;
    await this.page.goto('/admin/?muraAction=cSettings.editSite&siteid=default');
    await this.page.locator('select[name=siteLocale]').selectOption(locale);
    await this.page.getByRole('button', { name: /Save Settings/ }).click();
    await expect(this.page).toHaveURL(/cSettings\.list/);
  }

  /** The text of one of the theme's footer lines, as a visitor sees the home page. */
  async footerText(visitorPage: Page, id: 'greeting' | 'onlyenglish' | 'missing'): Promise<string> {
    const response = await visitorPage.goto('/index.cfm/');
    expect(response?.status()).toBe(200);
    return (await visitorPage.locator(`#e2e-rb-${id}`).innerText()).trim();
  }
}
