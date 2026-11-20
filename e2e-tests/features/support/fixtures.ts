import { Page } from '@playwright/test';
import { test as base, createBdd } from 'playwright-bdd';
import { ContentEditPage } from './pages/content-edit-page';
import { AdminSession } from './pages/admin-session';
import { CollectionsPage } from './pages/collections-page';
import { FormBuilderPage } from './pages/form-builder-page';
import { FormDataPage } from './pages/form-data-page';
import { ThemePage } from './pages/theme-page';
import { removeTestTheme } from '../../lib/test-theme';
import { FileBrowserPage } from './pages/file-browser-page';
import { CategoriesPage } from './pages/categories-page';
import { EmailSettingsPage } from './pages/email-settings-page';
import { MailCatcher } from '../../lib/mail-catcher';
import { ChangesetsPage } from './pages/changesets-page';
import { BundlesPage } from './pages/bundles-page';
import { SiteSearchPage } from './pages/site-search-page';
import { RestApiPage } from './pages/rest-api-page';
import { CachingPage } from './pages/caching-page';
import { LoginAttempts } from './pages/login-attempts';
import { PluginsPage } from './pages/plugins-page';
import { PublicFormPage } from './pages/public-form-page';
import { LayoutManagerPage } from './pages/layout-manager-page';
import { LoginPage } from './pages/login-page';
import { PublicSitePage } from './pages/public-site-page';
import { SiteManagerPage } from './pages/site-manager-page';
import { TrashPage } from './pages/trash-page';
import { PermissionsPage } from './pages/permissions-page';
import { UserAdminPage } from './pages/user-admin-page';
import { UploadedFiles } from './uploaded-files';

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

  // Masa removes the spaces from collection names, so those names get no space-separated suffix.
  uniqueWithoutSpaces(name: string): string {
    const real = `${name.replace(/\s+/g, '')}${this.stamp}x${this.names.size}`;
    this.names.set(name, real);
    return real;
  }

  /** Replaces <unique> in a value by this scenario's stamp, for values Masa keeps (URL titles, texts). */
  fill(text: string): string {
    return text.replaceAll('<unique>', String(this.stamp));
  }

  resolve(name: string): string {
    const real = this.names.get(name);
    if (!real) throw new Error(`No "${name}" was created in this scenario`);
    return real;
  }
}

// Test users made in a scenario, by the readable name the scenario uses.
export class Accounts {
  static readonly PASSWORD = 'Passw0rd!x1';
  private readonly users = new Map<string, { username: string; lastName: string; groups: string[] }>();
  readonly sessions = new Map<string, AdminSession>();

  add(label: string, user: { username: string; lastName: string; groups: string[] }) {
    this.users.set(label, user);
  }

  get(label: string) {
    const user = this.users.get(label);
    if (!user) throw new Error(`No user "${label}" was created in this scenario`);
    return user;
  }
}

// Ids Masa gives the forms made in a scenario, by the readable name the scenario uses.
export class Forms {
  private readonly ids = new Map<string, string>();
  readonly pages = new Map<string, string>();

  setId(name: string, id: string) {
    this.ids.set(name, id);
  }

  idOf(name: string): string {
    const id = this.ids.get(name);
    if (!id) throw new Error(`The form "${name}" was not put on a page in this scenario`);
    return id;
  }
}

export const test = base.extend<{
  changesets: ChangesetsPage;
  bundles: BundlesPage;
  siteSearch: SiteSearchPage;
  restApi: RestApiPage;
  caching: CachingPage;
  loginAttempts: LoginAttempts;
  visitorPage: Page;
  fileBrowser: FileBrowserPage;
  categories: CategoriesPage;
  emailSettings: EmailSettingsPage;
  mail: MailCatcher;
  themes: ThemePage;
  phoneVisitor: PublicSitePage;
  plugins: PluginsPage;
  formBuilder: FormBuilderPage;
  formData: FormDataPage;
  forms: Forms;
  visitorForm: PublicFormPage;
  names: ScenarioNames;
  loginPage: LoginPage;
  siteManager: SiteManagerPage;
  contentEdit: ContentEditPage;
  publicSite: PublicSitePage;
  trash: TrashPage;
  layout: LayoutManagerPage;
  collections: CollectionsPage;
  userAdmin: UserAdminPage;
  groupPermissions: PermissionsPage;
  accounts: Accounts;
  newSession: () => Promise<AdminSession>;
  visitor: PublicSitePage;
  uploads: UploadedFiles;
}>({
  names: async ({}, use) => use(new ScenarioNames()),
  changesets: async ({ page }, use) => use(new ChangesetsPage(page)),
  bundles: async ({ page }, use) => use(new BundlesPage(page)),
  // A visitor's search: a separate browser session that is not logged in.
  siteSearch: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL });
    await use(new SiteSearchPage(await context.newPage()));
    await context.close();
  },
  restApi: async ({ page, request }, use) => use(new RestApiPage(page, request)),
  // Caching is a setting of the whole site; a scenario that switched it on switches it off again.
  caching: async ({ page }, use) => {
    const caching = new CachingPage(page);
    await use(caching);
    if (caching.touched) await caching.setCaching(false).catch(() => {});
  },
  loginAttempts: async ({}, use) => use(new LoginAttempts()),
  // The raw page of a public visitor, for checks that run script in the page.
  visitorPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL });
    await use(await context.newPage());
    await context.close();
  },
  fileBrowser: async ({ page }, use) => use(new FileBrowserPage(page)),
  categories: async ({ page }, use) => use(new CategoriesPage(page)),
  // The mail server of the site is a setting of the whole site; a scenario that changed it puts it back.
  emailSettings: async ({ page }, use) => {
    const settings = new EmailSettingsPage(page);
    await use(settings);
    if (settings.touched) await settings.restoreDefaults().catch(() => {});
  },
  mail: async ({ request }, use) => use(new MailCatcher(request)),
  // The theme is a setting of the whole site; a scenario that changed it leaves the default theme behind.
  themes: async ({ page }, use) => {
    const themes = new ThemePage(page);
    await use(themes);
    if (themes.touched) {
      await themes.select('default').catch(() => {});
      removeTestTheme();
      await themes.reloadApplication().catch(() => {});
    }
  },
  // A visitor with a phone-sized screen.
  phoneVisitor: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 375, height: 800 } });
    await use(new PublicSitePage(await context.newPage()));
    await context.close();
  },
  // Plugins are installed for the whole CMS; one that a scenario installed is removed when it ends.
  plugins: async ({ page }, use) => {
    const plugins = new PluginsPage(page);
    await use(plugins);
    if (plugins.touched) await plugins.deleteIfInstalled('E2E Test Plugin').catch(() => {});
  },
  formBuilder: async ({ page }, use) => use(new FormBuilderPage(page)),
  formData: async ({ page }, use) => use(new FormDataPage(page)),
  forms: async ({}, use) => use(new Forms()),
  // A public visitor's view of a form: a separate browser session that is not logged in.
  visitorForm: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL });
    await use(new PublicFormPage(await context.newPage()));
    await context.close();
  },
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  siteManager: async ({ page }, use) => use(new SiteManagerPage(page)),
  contentEdit: async ({ page }, use) => use(new ContentEditPage(page)),
  publicSite: async ({ page }, use) => use(new PublicSitePage(page)),
  trash: async ({ page }, use) => use(new TrashPage(page)),
  layout: async ({ page }, use) => use(new LayoutManagerPage(page)),
  collections: async ({ page }, use) => use(new CollectionsPage(page)),
  userAdmin: async ({ page }, use) => use(new UserAdminPage(page)),
  groupPermissions: async ({ page }, use) => use(new PermissionsPage(page)),
  accounts: async ({}, use) => use(new Accounts()),
  // Opens a separate browser session, for a user other than the administrator.
  newSession: async ({ browser, baseURL }, use) => {
    const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
    await use(async () => {
      const context = await browser.newContext({ baseURL });
      contexts.push(context);
      return new AdminSession(await context.newPage());
    });
    for (const context of contexts) await context.close();
  },
  // A public visitor: a separate browser session that is not logged in, so pages show as published.
  visitor: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL });
    await use(new PublicSitePage(await context.newPage()));
    await context.close();
  },
  uploads: async ({}, use) => use(new UploadedFiles()),
});

export const { Given, When, Then } = createBdd(test);
