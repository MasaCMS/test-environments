import { expect, Page } from '@playwright/test';
import { expectNoEngineError } from '../../../lib/helpers';

export function slugOf(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export class PublicSitePage {
  constructor(private readonly page: Page) {}

  // Every public page is also checked for CFML engine error output.
  async expectPageVisible(title: string) {
    const response = await this.page.goto(`/index.cfm/${slugOf(title)}/`);
    expect(response?.status()).toBe(200);
    await expect(this.page).toHaveTitle(new RegExp(title, 'i'));
    await expectNoEngineError(this.page);
  }

  /** The page shows the uploaded image, and the browser can actually load it. */
  async expectImageShown(title: string, fileId: string) {
    await this.expectPageVisible(title);
    const image = this.page.locator(`img[src*="${fileId}"]`).first();
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  }

  async expectPageGone(title: string) {
    const response = await this.page.goto(`/index.cfm/${slugOf(title)}/`);
    expect(response?.status()).toBe(404);
  }
}
