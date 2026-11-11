import { test, expect } from '@playwright/test';
import {
  AUTH_FILE,
  ADMIN_PASSWORD,
  ADMIN_USER,
  expectNoEngineError,
  newPageUrl,
  siteManagerUrl,
} from './helpers';

test.describe('public site', () => {
  test('homepage renders without engine errors', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Home/);
    await expectNoEngineError(page);
  });
});

test.describe('admin login', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page).toHaveTitle(/Login/);
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto('/admin/');
    await page.locator('#username').fill(ADMIN_USER);
    await page.locator('#password').fill(`${ADMIN_PASSWORD}-wrong`);
    await page.locator('#loginForm').getByRole('button').first().click();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page).toHaveTitle(/Login/);
  });
});

test.describe('admin (authenticated)', () => {
  test.use({ storageState: AUTH_FILE });

  test('dashboard / site manager loads', async ({ page }) => {
    await page.goto(siteManagerUrl());
    await expect(page).toHaveTitle(/Site Content/);
    await expect(page.getByText('Add User')).toBeAttached();
    await expectNoEngineError(page);
  });

  test('create, publish and view a page', async ({ page }) => {
    const title = `E2E smoke ${Date.now()}`;

    await page.goto(newPageUrl());
    await page.locator('#mura-content-title-render').click();
    await page.keyboard.type(title);
    await page.locator('button.mura-primary', { hasText: 'Publish' }).click();

    // After publishing Masa returns to the site manager list.
    await expect(page).toHaveURL(/cArch\.list/);
    await expectNoEngineError(page);

    // Front end: the page exists under its URL-friendly title.
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const response = await page.goto(`/index.cfm/${slug}/`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(new RegExp(title, 'i'));
    await expectNoEngineError(page);
  });
});
