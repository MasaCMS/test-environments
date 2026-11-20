import { expect, Page } from '@playwright/test';
import { expectNoEngineError } from '../../../lib/helpers';

/** The Site Search display object on a public page: a search form that shows its results below it. */
export class SiteSearchPage {
  constructor(private readonly page: Page) {}

  private get object() {
    return this.page.locator('.mura-object[data-object=search]').first();
  }

  async open(path: string) {
    await this.page.goto(`/index.cfm/${path}`);
  }

  async search(keywords: string) {
    await this.page.locator('#txtKeywords').fill(keywords);
    await this.page.locator('#txtKeywords').press('Enter');
    await this.page.waitForLoadState('networkidle');
    await expectNoEngineError(this.page);
  }

  async expectResult(title: string) {
    await expect(this.object.getByRole('link', { name: title })).not.toHaveCount(0);
  }

  async expectNoResult(title: string) {
    await expect(this.object.getByRole('link', { name: title })).toHaveCount(0);
  }

  async expectNoResultsAtAll() {
    await expect(this.object.locator('.moreResults')).toHaveCount(0);
  }

  async expectResultCount(count: number) {
    await expect(this.object.locator('.moreResults')).toContainText(`of ${count}`);
  }

  /** What the search box shows after a search, as the visitor sees it. */
  async keywordsShown(): Promise<string> {
    return this.page.locator('#txtKeywords').inputValue();
  }

  async expectScriptNotRun() {
    expect(await this.page.evaluate(() => (window as any).__searchXss)).toBeUndefined();
  }
}
