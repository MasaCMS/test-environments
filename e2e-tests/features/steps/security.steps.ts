import { expect } from '@playwright/test';
import { Accounts } from '../support/fixtures';
import { Given, Then, When } from '../support/fixtures';
import { HOME_CONTENT_ID, SITE_ID, SITE_MANAGER_MODULE } from '../../lib/helpers';
import { slugOf } from '../support/pages/public-site-page';

// ---- authentication -------------------------------------------------------------------------

When('{string} tries to log in to the admin with a wrong password {int} times', async ({ accounts, newSession }, label: string, times: number) => {
  const session = await newSession();
  for (let i = 0; i < times; i++) {
    // After enough wrong passwords Masa stops offering the form: the account is locked.
    if (i > 0 && !(await session.page.locator('#username').count())) break;
    await session.login(accounts.get(label).username, 'Wrong-Passw0rd!');
  }
  accounts.sessions.set(label, session);
});

When('{string} logs in to the admin with the right password again', async ({ accounts }, label: string) => {
  const session = accounts.sessions.get(label)!;
  // Go to the login page again; it may no longer show a form.
  await session.page.goto('/admin/');
  if (await session.page.locator('#username').count()) await session.login(accounts.get(label).username, Accounts.PASSWORD);
});

Then('{string} is not logged in to the admin', async ({ accounts }, label: string) => {
  const page = accounts.sessions.get(label)!.page;
  // Not logged in: the admin menu with the log out link is not there.
  await expect(page.locator('a[href*="cLogin.logout"]')).toHaveCount(0);
});

When('someone tries to log in with an unknown user name and a password', async ({ newSession, loginAttempts, names }) => {
  const session = await newSession();
  await session.login(names.fill('nobody-<unique>'), 'Wrong-Passw0rd!');
  await loginAttempts.record('unknown user', session.page);
});

When('someone tries to log in as the administrator with a wrong password', async ({ newSession, loginAttempts }) => {
  const session = await newSession();
  await session.login('admin', 'Wrong-Passw0rd!');
  await loginAttempts.record('wrong password', session.page);
});

Then('both attempts get the same answer', async ({ loginAttempts }) => {
  loginAttempts.expectSameAnswer('unknown user', 'wrong password');
});

When('a visitor without a session opens the admin address {string}', async ({ newSession, loginAttempts }, path: string) => {
  const session = await newSession();
  await session.page.goto(path);
  loginAttempts.anonymousPage = session.page;
});

Then('the visitor is asked to log in', async ({ loginAttempts }) => {
  await expect(loginAttempts.anonymousPage!.locator('#loginForm')).toBeVisible();
});

// ---- injection ------------------------------------------------------------------------------

Then('the script in the title of the page at {string} is not run on the public site', async ({ visitorPage, names }, path: string) => {
  await visitorPage.addInitScript(() => undefined);
  await visitorPage.goto(`/index.cfm/${names.fill(path)}`);
  expect(await visitorPage.evaluate(() => (window as any).__titleXss)).toBeUndefined();
  // Masa either shows the tag as text or removes it; the page itself works.
  await expect(visitorPage.locator('body')).not.toContainText('Error Occurred');
});

// ---- CSRF ------------------------------------------------------------------------------------

When('a delete link for the page {string} is opened without a security token', async ({ siteManager, page, names }, name: string) => {
  const contentId = await siteManager.contentIdOf(names.resolve(name));
  await page.goto(
    `/admin/?muraAction=cArch.update&action=deleteall&contentid=${contentId}&type=Page&parentid=${HOME_CONTENT_ID}` +
      `&topid=${HOME_CONTENT_ID}&siteid=${SITE_ID}&moduleid=${SITE_MANAGER_MODULE}`,
  );
});

Then('the page {string} is still there', async ({ siteManager, visitor, names }, name: string) => {
  await siteManager.contentIdOf(names.resolve(name));
  await visitor.expectPageVisible(names.resolve(name));
});
