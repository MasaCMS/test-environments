import { expect, test } from '@playwright/test';
import { AUTH_FILE } from '../lib/helpers';
import { CollectionsPage } from '../features/support/pages/collections-page';
import { ContentEditPage } from '../features/support/pages/content-edit-page';
import { FormBuilderPage } from '../features/support/pages/form-builder-page';
import { FormDataPage } from '../features/support/pages/form-data-page';
import { LayoutManagerPage } from '../features/support/pages/layout-manager-page';
import { PluginsPage } from '../features/support/pages/plugins-page';
import { PublicFormPage } from '../features/support/pages/public-form-page';
import { CategoriesPage } from '../features/support/pages/categories-page';
import { EmailSettingsPage } from '../features/support/pages/email-settings-page';
import { FileBrowserPage } from '../features/support/pages/file-browser-page';
import { UserAdminPage } from '../features/support/pages/user-admin-page';
import { MailCatcher, MAIL_SMTP_HOST, MAIL_SMTP_PORT } from '../lib/mail-catcher';
import { slugOf } from '../features/support/pages/public-site-page';

// Each test asserts the behaviour a finding in RESULTS.md describes, as it is today.
// A passing test means the finding is still there; a failing one means Masa changed
// (fixed, or different), so the finding needs another look. Used for the "7.6" column.
test.use({ storageState: AUTH_FILE });

const stamp = () => String(Date.now());

test('F-10 Masa removes the spaces from a collection name', async ({ page }) => {
  const collections = new CollectionsPage(page);
  const id = stamp();
  await collections.createLocalIndex(`Spaced name ${id}`);
  await collections.open();
  await expect(page.getByText(`Spacedname${id}`, { exact: true })).toBeVisible();
});

async function formWithChoicesOnPage(page: import('@playwright/test').Page, id: string) {
  const builder = new FormBuilderPage(page);
  await builder.openNew();
  await builder.setTitle(`Probe form ${id}`);
  await builder.addField({ type: 'Radio buttons', label: 'Colour', options: ['Red', 'Blue'] });
  await builder.publish();
  const pageTitle = `Probe page ${id}`;
  await new ContentEditPage(page).createAndPublishPage(pageTitle);
  const layout = new LayoutManagerPage(page);
  await layout.startInlineEditing(pageTitle);
  await layout.addObject('Form');
  await layout.setForm(`Probe form ${id}`);
  await layout.publish();
  return { pageTitle, formId: await page.locator('form.mura-form input[name=formid]').inputValue() };
}

test('F-22 the CSV download holds the entry time as a raw CFML timestamp', async ({ browser, page, baseURL }) => {
  test.setTimeout(120_000);
  const { pageTitle, formId } = await formWithChoicesOnPage(page, stamp());
  const context = await browser.newContext({ baseURL });
  const form = new PublicFormPage(await context.newPage());
  await form.open(pageTitle);
  await form.fill('Colour', 'Red');
  await form.submit();
  await form.expectSubmitted();
  await context.close();
  const data = new FormDataPage(page);
  await data.open(formId);
  expect(await data.downloadCsv()).toMatch(/\{ts '\d{4}-\d{2}-\d{2} /);
});

test('F-23 a duplicate form title discards the fields of the form being built', async ({ page }) => {
  test.setTimeout(120_000);
  const id = stamp();
  const builder = new FormBuilderPage(page);
  await builder.openNew();
  await builder.setTitle(`Duplicate probe ${id}`);
  await builder.addField({ type: 'Text field', label: 'First' });
  await builder.publish();
  await builder.openNew();
  await builder.setTitle(`Duplicate probe ${id}`);
  await builder.addField({ type: 'Text field', label: 'Second' });
  await page.locator('button.mura-primary', { hasText: 'Publish' }).click();
  await expect(page.getByText('already in use')).toBeVisible();
  expect(await builder.listedFields()).toEqual([]);
});

test('F-26 uploading a newer zip through Install Plugin installs a second copy', async ({ page }) => {
  test.setTimeout(120_000);
  const plugins = new PluginsPage(page);
  try {
    await plugins.deleteIfInstalled('E2E Test Plugin');
    await plugins.deploy(1);
    await plugins.deploy(2);
    await plugins.openGlobalList();
    expect((await plugins.rows()).filter((r) => r.name === 'E2E Test Plugin').length).toBe(2);
  } finally {
    for (let i = 0; i < 3; i++) await plugins.deleteIfInstalled('E2E Test Plugin').catch(() => {});
  }
});

test('F-27 the provider link in the plugin list is URL-encoded', async ({ page }) => {
  test.setTimeout(120_000);
  const plugins = new PluginsPage(page);
  try {
    await plugins.deleteIfInstalled('E2E Test Plugin');
    await plugins.deploy(1);
    await plugins.openGlobalList();
    const href = await page.locator('#tabPlugins table tbody tr', { hasText: 'E2E Test Plugin' }).locator('a', { hasText: 'E2E tests' }).getAttribute('href');
    expect(href).toContain('https%3A%2F%2F');
  } finally {
    await plugins.deleteIfInstalled('E2E Test Plugin').catch(() => {});
  }
});

// ---- sections 8 to 10 -------------------------------------------------------------------

test('F-30 the editor\'s file browser cannot select a PDF', async ({ page }) => {
  test.setTimeout(120_000);
  const fb = new FileBrowserPage(page);
  await fb.open();
  const name = `probe-${stamp()}.pdf`;
  await fb.upload('test-document.pdf', name);
  const edit = new ContentEditPage(page);
  await edit.openNew('Page');
  await edit.typeAndSelectBodyText('link text');
  await page.locator('#cke_body .cke_button__link').click();
  const [browser] = await Promise.all([page.context().waitForEvent('page'), page.getByText('Browse Server').click()]);
  await browser.waitForLoadState();
  await browser.getByPlaceholder('Type to filter').fill(name);
  await browser.locator('i[title="Grid View"]').click();
  await browser.locator('.gridmode-wrapper i.btn.mi-ellipsis-v').first().click();
  const menu = await browser.locator('#newContentMenu').innerText();
  // The menu has no Select, so the file cannot be chosen for the link.
  expect(menu).not.toContain('Select');
  expect(menu).toContain('Rename');
});

test('F-31 a category page outside a folder lists no content', async ({ page, browser, baseURL }) => {
  test.setTimeout(120_000);
  const id = stamp();
  const categories = new CategoriesPage(page);
  await categories.create(`Root cat ${id}`);
  await new ContentEditPage(page).createAndPublish({ title: `Root page ${id}`, body: '<p>x</p>', categories: [`Root cat ${id}`] });
  const context = await browser.newContext({ baseURL });
  const visitor = await context.newPage();
  await visitor.goto(`/index.cfm/category/${slugOf(`Root cat ${id}`)}/`);
  await expect(visitor.locator('section.content')).not.toContainText(`Root page ${id}`);
  await context.close();
});

test.describe('email', () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!(await new MailCatcher(request).isRunning()), 'Mailpit is not running');
  });

  test('F-32 the Email Subject setting of the form builder is not used', async ({ page, browser, baseURL, request }) => {
    test.setTimeout(150_000);
    const mail = new MailCatcher(request);
    const settings = new EmailSettingsPage(page);
    try {
      await settings.open();
      await settings.useServer({ host: MAIL_SMTP_HOST, port: MAIL_SMTP_PORT });
      await settings.save();
      await mail.clear();
      const id = stamp();
      const builder = new FormBuilderPage(page);
      await builder.openNew();
      await builder.setTitle(`Subject probe ${id}`);
      await builder.addField({ type: 'Text field', label: 'Your name' });
      await builder.setNotificationEmail('probe@example.com');
      await builder.setNotificationHeaders({ subject: `Custom subject ${id}` });
      await builder.publish();
      const pageTitle = `Subject page ${id}`;
      await new ContentEditPage(page).createAndPublishPage(pageTitle);
      const layout = new LayoutManagerPage(page);
      await layout.startInlineEditing(pageTitle);
      await layout.addObject('Form');
      await layout.setForm(`Subject probe ${id}`);
      await layout.publish();
      const context = await browser.newContext({ baseURL });
      const form = new PublicFormPage(await context.newPage());
      await form.open(pageTitle);
      await form.fill('Your name', 'Probe');
      await form.submit();
      await form.expectSubmitted();
      await context.close();
      const [message] = await mail.waitForMessages(1);
      expect(message.subject).toBe(`Subject probe ${id}`);
    } finally {
      await settings.restoreDefaults().catch(() => {});
    }
  });

  test('F-33 the forgotten password email of the admin login is not sent through the site mail server', async ({ page, browser, baseURL, request }) => {
    test.setTimeout(150_000);
    const mail = new MailCatcher(request);
    const settings = new EmailSettingsPage(page);
    try {
      await settings.open();
      await settings.useServer({ host: MAIL_SMTP_HOST, port: MAIL_SMTP_PORT });
      await settings.save();
      await mail.clear();
      const username = `forgot${stamp()}`;
      await new UserAdminPage(page).createUser({ firstName: 'Forgot', lastName: 'Password', username, password: 'Passw0rd!x1', system: true });
      // Not logged in: the probe must start from the login page.
      const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
      const visitor = await context.newPage();
      await visitor.goto('/admin/');
      await visitor.getByText('Forget your password?').first().click();
      await visitor.locator('input[name=email]').fill(`${username}@example.com`);
      await visitor.locator('input[type=submit]').click();
      // Masa says the information was sent ...
      await expect(visitor.getByText('your account information has been sent to you')).toBeVisible();
      await context.close();
      // ... but nothing reaches the mail server of the site.
      await mail.expectNoMessages(10_000);
    } finally {
      await settings.restoreDefaults().catch(() => {});
    }
  });
});
