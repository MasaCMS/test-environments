import { test as base, createBdd } from 'playwright-bdd';
import { ContentEditPage } from './pages/content-edit-page';
import { LoginPage } from './pages/login-page';
import { PublicSitePage } from './pages/public-site-page';
import { SiteManagerPage } from './pages/site-manager-page';

// Scenarios write readable names ("About us"). Masa content is shared and
// persists, so the real title gets a unique suffix; later steps look the real
// title up again by the readable name.
export class ScenarioNames {
  private readonly names = new Map<string, string>();
  private readonly stamp = Date.now();

  unique(name: string): string {
    const real = `${name} ${this.stamp}-${this.names.size}`;
    this.names.set(name, real);
    return real;
  }

  resolve(name: string): string {
    const real = this.names.get(name);
    if (!real) throw new Error(`No "${name}" was created in this scenario`);
    return real;
  }
}

export const test = base.extend<{
  names: ScenarioNames;
  loginPage: LoginPage;
  siteManager: SiteManagerPage;
  contentEdit: ContentEditPage;
  publicSite: PublicSitePage;
}>({
  names: async ({}, use) => use(new ScenarioNames()),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  siteManager: async ({ page }, use) => use(new SiteManagerPage(page)),
  contentEdit: async ({ page }, use) => use(new ContentEditPage(page)),
  publicSite: async ({ page }, use) => use(new PublicSitePage(page)),
});

export const { Given, When, Then } = createBdd(test);
