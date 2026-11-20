import { expect, Page } from '@playwright/test';
import { expectNoEngineError } from '../../../lib/helpers';

export function slugOf(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
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

  /** Visits a public path (relative to /index.cfm/) and returns the response status. */
  async statusOf(path: string) {
    const response = await this.page.goto(`/index.cfm/${path}`);
    return response!.status();
  }

  async expectPath(path: string) {
    expect(await this.statusOf(path), `GET /index.cfm/${path}`).toBe(200);
    await expectNoEngineError(this.page);
  }

  async expectText(text: string) {
    await expect(this.page.locator('body')).toContainText(text);
  }

  /** Display objects on the public page, in page order. */
  async displayObjects(title: string): Promise<string[]> {
    await this.expectPageVisible(title);
    return this.page.locator('.mura-object').evaluateAll((els) => els.map((e) => e.getAttribute('data-object') ?? ''));
  }

  /** Items listed by a Collection display object. */
  async collectionItemCount(): Promise<number> {
    return this.page.locator('.mura-object[data-object=collection] dl').count();
  }

  /** Titles listed by a Collection display object, in page order. */
  async collectionItemTitles(): Promise<string[]> {
    const titles = await this.page.locator('.mura-object[data-object=collection] dt.title').allInnerTexts();
    return titles.map((t) => t.trim());
  }

  async expectElement(selector: string) {
    await expect(this.page.locator(selector).first()).toBeAttached();
  }

  async expectNoElement(selector: string) {
    await expect(this.page.locator(selector)).toHaveCount(0);
  }

  /** The CSS colour the browser computes for an element, as `rgb(r, g, b)`. */
  async colorOf(selector: string): Promise<string> {
    return this.page.locator(selector).first().evaluate((el) => getComputedStyle(el).color);
  }

  /** The page is wider than the screen, so it scrolls sideways. */
  async scrollsSideways(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  }

  async isShown(selector: string): Promise<boolean> {
    return this.page.locator(selector).first().isVisible();
  }

  /** A link on the page whose address contains `part` can be followed and serves a file. */
  async expectLinkServesFile(part: string) {
    const href = await this.page.locator(`a[href*="${part}"]`).first().getAttribute('href');
    expect(href, `a link to ${part}`).toBeTruthy();
    const response = await this.page.request.get(new URL(href!, this.page.url()).toString());
    expect(response.status()).toBe(200);
  }

  /** The listing at a public path (relative to /index.cfm/) names these titles, and not those. */
  async expectListing(path: string, shows: string[], hides: string[] = []) {
    await this.expectPath(path);
    // The site menu lists every page, so only the content area counts.
    const listing = this.page.locator('section.content');
    for (const title of shows) await expect(listing).toContainText(title);
    for (const title of hides) await expect(listing).not.toContainText(title);
  }

  async expectNoText(text: string) {
    await expect(this.page.locator('body')).not.toContainText(text);
  }

  async expectMetaDescription(text: string) {
    await expect(this.page.locator('meta[name=description]')).toHaveAttribute('content', text);
  }

  // Uses a plain request, so an editor open in the browser stays where it is.
  async expectPageGone(title: string) {
    const response = await this.page.request.get(`/index.cfm/${slugOf(title)}/`);
    expect(response.status()).toBe(404);
  }
}
