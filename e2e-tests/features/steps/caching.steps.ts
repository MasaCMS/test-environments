import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';

Given('site caching is switched on', async ({ caching }) => {
  await caching.setCaching(true);
});

When('I switch site caching on', async ({ caching }) => {
  await caching.setCaching(true);
});

When('I switch site caching off', async ({ caching }) => {
  await caching.setCaching(false);
});

Then('the site settings show site caching on', async ({ caching }) => {
  expect(await caching.cachingIsOn()).toBe(true);
});

Then('the site settings show site caching off', async ({ caching }) => {
  expect(await caching.cachingIsOn()).toBe(false);
});

Then('the admin warns that caching is off', async ({ caching }) => {
  await caching.expectOffWarning(true);
});

Then('the admin does not warn about caching', async ({ caching }) => {
  await caching.expectOffWarning(false);
});

When('I reload the application from the admin menu', async ({ caching }) => {
  await caching.reloadFromMenu();
});

When('I reload the application with the URL parameter', async ({ caching }) => {
  await caching.reloadFromUrl();
});

// A visitor looks a page up twice: the second look is served from the cache.
Then('a visitor sees {string} on the page {string}', async ({ visitor, names }, text: string, name: string) => {
  await visitor.expectPageVisible(names.resolve(name));
  await visitor.expectText(names.fill(text));
});

Then('a visitor does not see {string} on the page {string}', async ({ visitor, names }, text: string, name: string) => {
  await visitor.expectPageVisible(names.resolve(name));
  await visitor.expectNoText(names.fill(text));
});
