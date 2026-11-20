import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';

const PLUGIN = 'E2E Test Plugin';
const PACKAGE = 'E2ETestPlugin';

// ---- installing and removing -----------------------------------------------------

Given('the E2E test plugin is not installed', async ({ plugins }) => {
  await plugins.deleteIfInstalled(PLUGIN);
});

Given('the E2E test plugin is installed and active on the default site', async ({ plugins }) => {
  await plugins.deleteIfInstalled(PLUGIN);
  await plugins.deploy(1);
  await plugins.assignToSite(PLUGIN, true);
});

When('I install the E2E test plugin by uploading its zip file', async ({ plugins }) => {
  await plugins.deploy(1);
});

When('I update the E2E test plugin to version 2', async ({ plugins }) => {
  await plugins.updateVersion(PLUGIN, 2);
});

When('I delete the E2E test plugin', async ({ plugins }) => {
  await plugins.delete(PLUGIN);
});

// ---- the plugin lists -------------------------------------------------------------

Then(
  'the plugin list shows the E2E test plugin as version {string} by {string} in the category {string}',
  async ({ plugins }, version: string, provider: string, category: string) => {
    await plugins.openGlobalList();
    const row = (await plugins.rows()).find((r) => r.name === PLUGIN);
    expect(row, 'the plugin is in the list').toBeTruthy();
    expect(row).toMatchObject({ version, provider, category });
  },
);

Then('the plugin list shows the E2E test plugin only once', async ({ plugins }) => {
  await plugins.openGlobalList();
  expect((await plugins.rows()).filter((r) => r.name === PLUGIN)).toHaveLength(1);
});

Then('the E2E test plugin is in the plugin list', async ({ plugins }) => {
  expect(await plugins.isInstalled(PLUGIN)).toBe(true);
});

Then('the E2E test plugin is not in the plugin list', async ({ plugins }) => {
  expect(await plugins.isInstalled(PLUGIN)).toBe(false);
});

When('I activate the E2E test plugin on the default site', async ({ plugins }) => {
  await plugins.assignToSite(PLUGIN, true);
});

When('I deactivate the E2E test plugin on the default site', async ({ plugins }) => {
  await plugins.assignToSite(PLUGIN, false);
});

Then('the E2E test plugin is listed under Site Plugins', async ({ plugins }) => {
  expect(await plugins.sitePlugins()).toContain(PLUGIN);
});

Then('the E2E test plugin is not listed under Site Plugins', async ({ plugins }) => {
  expect(await plugins.sitePlugins()).not.toContain(PLUGIN);
});

// ---- settings --------------------------------------------------------------------

Then('the setting {string} of the E2E test plugin is {string}', async ({ plugins }, setting: string, value: string) => {
  expect(await plugins.settingValue(PLUGIN, setting)).toBe(value);
});

When('I change the setting {string} of the E2E test plugin to {string}', async ({ plugins }, setting: string, value: string) => {
  await plugins.changeSetting(PLUGIN, setting, value);
});

// ---- the plugin's own admin page -----------------------------------------------------

When('I open the admin page of the E2E test plugin', async ({ plugins, page }) => {
  expect(await plugins.adminPageStatus(PACKAGE)).toBe(200);
  await expect(page.locator('#e2e-plugin-admin')).toBeVisible();
});

Then('the plugin admin page shows the greeting {string}', async ({ page }, greeting: string) => {
  await expect(page.locator('#e2e-plugin-greeting-setting')).toHaveText(greeting);
});

Then('the admin page of the E2E test plugin is gone', async ({ plugins, page }) => {
  expect(await plugins.adminPageStatus(PACKAGE)).not.toBe(200);
  await expect(page.locator('#e2e-plugin-admin')).toHaveCount(0);
});

// ---- the plugin's display object -----------------------------------------------------

When('I add the plugin display object {string} of {string}', async ({ layout }, displayObject: string, plugin: string) => {
  await layout.addPluginObject(plugin, displayObject);
});

Then('the public page {string} shows the plugin text {string}', async ({ visitor, names }, name: string, text: string) => {
  await visitor.expectPageVisible(names.resolve(name));
  await visitor.expectText(text);
});

Then('the public page {string} does not show the plugin text {string}', async ({ visitor, names }, name: string, text: string) => {
  await visitor.expectPageVisible(names.resolve(name));
  await visitor.expectNoText(text);
});

Then('the inline editor does not offer the Plugin display object', async ({ layout }) => {
  expect(await layout.offeredObjects()).not.toContain('Plugin');
});
