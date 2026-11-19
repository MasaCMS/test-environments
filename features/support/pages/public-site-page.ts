import { expect, Page } from '@playwright/test';
import { expectNoEngineError } from '../../../e2e/helpers';

export class PublicSitePage {
  constructor(private readonly page: Page) {}

  // Every public page is also checked for CFML engine error output.
  async expectPageVisible(title: string) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const response = await this.page.goto(`/index.cfm/${slug}/`);
    expect(response?.status()).toBe(200);
    await expect(this.page).toHaveTitle(new RegExp(title, 'i'));
    await expectNoEngineError(this.page);
  }
}
