import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import { slugOf } from '../support/pages/public-site-page';

// ---- the JSON API ------------------------------------------------------------------------

Given('the API client is ready', async ({ restApi }) => {
  await restApi.start();
});

When('I sign in to the API as {string} with the password {string}', async ({ restApi }, user: string, password: string) => {
  await restApi.login(user, password);
});

Then('the API sign-in succeeds', async ({ restApi }) => {
  expect(restApi.lastLogin).toBe('success');
});

Then('the API sign-in fails', async ({ restApi }) => {
  expect(restApi.lastLogin).not.toBe('success');
});

When('I request {string} from the API without signing in', async ({ restApi }, path: string) => {
  await restApi.get(path);
});

Then('the API answers with status {int} and JSON', async ({ restApi }, status: number) => {
  restApi.expectStatus(status);
  restApi.expectJson();
});

Then('the API answer lists {string} content', async ({ restApi }, entity: string) => {
  expect(restApi.response?.body.data.entityname).toBe(entity);
  expect(restApi.response?.body.data.items.length).toBeGreaterThan(0);
});

Then('the API answer says {string}', async ({ restApi }, message: string) => {
  expect(JSON.stringify(restApi.response?.body)).toContain(message);
});

// ---- content through the API ---------------------------------------------------------------

When('I create the page {string} through the API', async ({ restApi, names }, name: string) => {
  await restApi.createPage(name, names.unique(name));
});

Then('the API refused to save the page', async ({ restApi }) => {
  expect(restApi.saveRefused).toBe(true);
});

When('I rename the page {string} through the API to {string}', async ({ restApi, names }, name: string, title: string) => {
  await restApi.rename(name, names.unique(title));
});

When('I delete the page {string} through the API', async ({ restApi }, name: string) => {
  await restApi.remove(name);
});

Then('the API finds the page {string}', async ({ restApi, names }, name: string) => {
  expect(await restApi.titlesFound(names.resolve(name))).toContain(names.resolve(name));
});

Then('the API does not find the page {string}', async ({ restApi, names }, name: string) => {
  expect(await restApi.titlesFound(names.resolve(name))).toHaveLength(0);
});

Then('the page {string} is on the public site for a visitor through its API address', async ({ visitor, names }, name: string) => {
  await visitor.expectPageVisible(names.resolve(name));
});

Then('the page {string} is gone from the public site for a visitor', async ({ visitor, names }, name: string) => {
  expect(await visitor.statusOf(`${slugOf(names.resolve(name))}/`)).toBe(404);
});
