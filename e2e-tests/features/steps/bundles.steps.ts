import { expect } from '@playwright/test';
import { Then, When } from '../support/fixtures';

When('I create a site bundle', async ({ bundles }) => {
  await bundles.create();
});

When('I create a site bundle including the site members and administrative users', async ({ bundles }) => {
  await bundles.create({ includeUsers: true });
});

When('I create a site bundle including the form response data', async ({ bundles }) => {
  await bundles.create({ includeFormData: true });
});

Then('the bundle is downloaded as a zip file named like {string}', async ({ bundles }, pattern: string) => {
  expect(bundles.downloaded.fileName).toMatch(new RegExp(`^${pattern}$`));
  expect(bundles.downloaded.entries().length).toBeGreaterThan(0);
});

Then('the bundle contains the page {string}', async ({ bundles, names }, title: string) => {
  expect(bundles.downloaded.read('wddx_rstcontent.xml')).toContain(names.resolve(title));
});

Then('the bundle contains the site files', async ({ bundles }) => {
  expect(bundles.downloaded.entries()).toContain('sitefiles.zip');
});

Then('the bundle contains the file {string}', async ({ bundles }, entry: string) => {
  expect(bundles.downloaded.entries()).toContain(entry);
});

Then('the bundle does not contain the file {string}', async ({ bundles }, entry: string) => {
  expect(bundles.downloaded.entries()).not.toContain(entry);
});

When('I open the Deploy Bundle tab of the site settings', async ({ bundles }) => {
  await bundles.openDeploy();
});

Then('the deploy options offer {string}', async ({ bundles }, option: string) => {
  expect(await bundles.deployOptions()).toContain(option);
});
