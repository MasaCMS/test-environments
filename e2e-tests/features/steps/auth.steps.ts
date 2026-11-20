import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { AUTH_FILE, expectNoEngineError, login, siteManagerUrl } from '../../lib/helpers';
import { Given, Then, When } from '../support/fixtures';

// Reuses the admin session that global-setup saved, so no UI login per scenario.
// A long run outlives the saved session (Masa ends it after a while), so a saved session
// that no longer works is replaced by a new login, which is saved for the scenarios after it.
Given('I am logged in as an administrator', async ({ context, page }) => {
  const state = JSON.parse(readFileSync(AUTH_FILE, 'utf8'));
  await context.addCookies(state.cookies);
  const response = await context.request.get(siteManagerUrl());
  if ((await response.text()).includes('id="loginForm"')) {
    await login(page);
    await context.storageState({ path: AUTH_FILE });
  }
});

Given('I am on the admin login page', async ({ loginPage }) => {
  await loginPage.open();
});

When('I log in with valid administrator credentials', async ({ loginPage }) => {
  await loginPage.loginAsAdministrator();
});

When('I log in with a wrong password', async ({ loginPage }) => {
  await loginPage.loginWithWrongPassword();
});

Then('I see the Site Manager', async ({ page, siteManager }) => {
  await expect(page).toHaveURL(/muraAction=/);
  await siteManager.expectVisible();
  await expectNoEngineError(page);
});

Then('I am still on the admin login page', async ({ loginPage }) => {
  await loginPage.expectVisible();
});
