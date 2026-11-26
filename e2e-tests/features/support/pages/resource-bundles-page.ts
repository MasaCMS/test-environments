import { expect, Locator, Page } from '@playwright/test';

/** Site Settings > Basic > Locale: the language Masa looks for first in the resource bundles. */
export class ResourceBundlesPage {
  /** Set when a scenario changed the site locale, so that the default locale is put back afterwards. */
  touched = false;

  constructor(private readonly page: Page) {}

  /**
   * @param language English name of the language ("Dutch"), or '' for the default (empty) option.
   * The select lists server.coldfusion.supportedLocales, whose names differ per engine
   * (Lucee "dutch", ACF "Dutch (Standard)"), so the option is looked up, not hard-coded.
   */
  async setSiteLocale(language: string) {
    this.touched = true;
    await this.page.goto('/admin/?muraAction=cSettings.editSite&siteid=default');
    const select = this.page.locator('select[name=siteLocale]');
    await select.selectOption(language === '' ? '' : await this.findLocaleValue(select, language));
    await this.page.getByRole('button', { name: /Save Settings/ }).click();
    await expect(this.page).toHaveURL(/cSettings\.list/);
  }

  /** The value of the first option for the language: its name starts with it, or its code is the language code (nl, nl_NL). */
  private async findLocaleValue(select: Locator, language: string): Promise<string> {
    const code = new Intl.DisplayNames(['en'], { type: 'language' });
    const options = await select.locator('option').evaluateAll((els) =>
      els.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent ?? '' })),
    );
    const name = language.toLowerCase();
    const isName = (o: { value: string; label: string }) =>
      [o.value, o.label].some((t) => t.trim().toLowerCase().startsWith(name));
    const isCode = (o: { value: string }) => {
      const lang = o.value.split(/[_-]/)[0];
      return /^[a-z]{2}$/i.test(lang) && code.of(lang.toLowerCase())?.toLowerCase() === name;
    };
    // Prefer "Dutch" or "Dutch (Standard)" over the Belgian variant.
    const matches = options.filter((o) => isName(o) || isCode(o));
    const plain = matches.find((o) => !/belg|[_-]be\b/i.test(`${o.value} ${o.label}`)) ?? matches[0];
    if (!plain) throw new Error(`No site locale option for "${language}". Options: ${options.map((o) => o.value).join(', ')}`);
    return plain.value;
  }

  /** The text of one of the theme's footer lines, as a visitor sees the home page. */
  async footerText(visitorPage: Page, id: 'greeting' | 'onlyenglish' | 'missing'): Promise<string> {
    const response = await visitorPage.goto('/index.cfm/');
    expect(response?.status()).toBe(200);
    return (await visitorPage.locator(`#e2e-rb-${id}`).innerText()).trim();
  }
}
