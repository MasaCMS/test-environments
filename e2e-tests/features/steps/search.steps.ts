import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import { slugOf } from '../support/pages/public-site-page';

// ---- the public search page ----------------------------------------------------------------

// A page with the Site Search display object is the place where a visitor searches.
Given('a search page titled {string}', async ({ contentEdit, layout, names }, name: string) => {
  const title = names.unique(name);
  await contentEdit.createAndPublish(title);
  await layout.startInlineEditing(title);
  await layout.addObject('Site Search');
  await layout.publish();
});

When('a visitor searches for {string} on the search page {string}', async ({ siteSearch, names }, keywords: string, name: string) => {
  await siteSearch.open(`${slugOf(names.resolve(name))}/`);
  await siteSearch.search(names.fill(keywords));
});

Then('the search finds the page {string}', async ({ siteSearch, names }, title: string) => {
  await siteSearch.expectResult(names.resolve(title));
});

Then('the search does not find the page {string}', async ({ siteSearch, names }, title: string) => {
  await siteSearch.expectNoResult(names.resolve(title));
});

Then('the search finds nothing', async ({ siteSearch }) => {
  await siteSearch.expectNoResultsAtAll();
});

Then('the search runs no script from the search text', async ({ siteSearch }) => {
  await siteSearch.expectScriptNotRun();
});

// ---- the admin search ---------------------------------------------------------------------

When('I search the Site Manager for {string}', async ({ siteManager, names }, keywords: string) => {
  await siteManager.search(names.fill(keywords));
});

Then('the Site Manager search lists the page {string}', async ({ siteManager, names }, title: string) => {
  await siteManager.expectSearchResult(names.resolve(title));
});

Then('the Site Manager search does not list the page {string}', async ({ siteManager, names }, title: string) => {
  await siteManager.expectNoSearchResult(names.resolve(title));
});
