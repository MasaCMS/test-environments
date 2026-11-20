import { Browser, Page } from '@playwright/test';
import { AUTH_FILE, login, newPageUrl, siteManagerUrl } from '../../../lib/helpers';

/** The screen sizes the test plan names: phones in both orientations, and a tablet. */
export const SCREENS: Record<string, { width: number; height: number }> = {
  'phone': { width: 375, height: 812 },
  'phone landscape': { width: 812, height: 375 },
  'tablet': { width: 768, height: 1024 },
};

export function screenSize(name: string) {
  const size = SCREENS[name];
  if (!size) throw new Error(`Unknown screen "${name}"; known screens: ${Object.keys(SCREENS).join(', ')}`);
  return size;
}

/** A browser session with a given screen size, for the public site or (logged in) the admin. */
export class ScreenSession {
  constructor(readonly page: Page) {}

  static async open(browser: Browser, baseURL: string | undefined, screen: string, asAdmin = false) {
    const context = await browser.newContext({
      baseURL,
      viewport: screenSize(screen),
      ...(asAdmin ? { storageState: AUTH_FILE } : {}),
    });
    const page = await context.newPage();
    if (asAdmin) {
      await page.goto(siteManagerUrl());
      if (await page.locator('#loginForm').count()) await login(page);
    }
    return { session: new ScreenSession(page), close: () => context.close() };
  }

  async scrollsSideways(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  }

  async openNewPageEditor() {
    await this.page.goto(newPageUrl());
    await this.page.locator('#mura-content-title-render').waitFor();
  }

  async typeTitle(title: string) {
    await this.page.locator('#mura-content-title-render').click();
    await this.page.keyboard.type(title);
  }

  async titleShown(): Promise<string> {
    // The title is typed into a styled box; Masa copies it into the form field `title` as it is typed.
    return (await this.page.locator('input[name=title]').inputValue()).trim();
  }
}
