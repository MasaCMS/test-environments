import { expect } from '@playwright/test';
import { expectNoEngineError } from '../../lib/helpers';
import { Then, When } from '../support/fixtures';

When('I create and publish a page titled {string}', async ({ contentEdit, names }, name: string) => {
  await contentEdit.createAndPublishPage(names.unique(name));
});

Then('the page {string} is visible on the public site', async ({ publicSite, names }, name: string) => {
  await publicSite.expectPageVisible(names.resolve(name));
});

Then('the public site renders without engine errors', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expectNoEngineError(page);
});
