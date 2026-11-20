import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, Then, When } from '../support/fixtures';
import { slugOf } from '../support/pages/public-site-page';

const list = (text: string) => text.split(',').map((s) => s.trim()).filter(Boolean);

// ---- categories in the admin ------------------------------------------------------------

Given('a category {string} exists', async ({ categories, names }, name: string) => {
  await categories.create(names.unique(name));
});

When('I create the category {string}', async ({ categories, names }, name: string) => {
  await categories.create(names.unique(name));
});

When('I create the category {string} under {string}', async ({ categories, names }, name: string, parent: string) => {
  await categories.create(names.unique(name), names.resolve(parent));
});

Then('the category {string} is listed', async ({ categories, names }, name: string) => {
  expect(await categories.isListed(names.resolve(name))).toBe(true);
});

Then('the category {string} is not listed', async ({ categories, names }, name: string) => {
  expect(await categories.isListed(names.resolve(name))).toBe(false);
});

Then('the category {string} is listed below the category {string}', async ({ categories, names }, child: string, parent: string) => {
  expect(await categories.depthOf(names.resolve(parent))).toBe(0);
  expect(await categories.depthOf(names.resolve(child))).toBe(1);
  const order = await categories.names();
  expect(order.indexOf(names.resolve(child))).toBe(order.indexOf(names.resolve(parent)) + 1);
});

When('I delete the category {string}', async ({ categories, names }, name: string) => {
  await categories.delete(names.resolve(name));
});

// ---- content with categories and tags ----------------------------------------------------
// The listings of a category or a tag belong to a Folder: its pages are listed, filtered
// by the category or tag in the address (/folder/category/<name>/, /folder/tag/<name>/).

Given('a folder {string} is published', async ({ contentEdit, names }, title: string) => {
  await contentEdit.createAndPublish({ title: names.unique(title), type: 'Folder' });
});

// Rows: Title, Categories, Tags (the last two optional, comma separated).
Given('these pages are published in the folder {string}:', async ({ contentEdit, siteManager, names }, folder: string, table: DataTable) => {
  const parentId = await siteManager.contentIdOf(names.resolve(folder));
  for (const row of table.hashes()) {
    await contentEdit.createAndPublish({
      title: names.unique(row.Title),
      parentId,
      body: `<p>${row.Title}</p>`,
      categories: row.Categories ? list(row.Categories).map((c) => names.resolve(c)) : undefined,
      tags: row.Tags ? list(row.Tags).map((t) => names.fill(t)) : undefined,
    });
  }
});

When(
  'I change the page {string} in the folder {string} to have the categories {string} and the tags {string}',
  async ({ siteManager, contentEdit, names }, title: string, folder: string, categories: string, tags: string) => {
    await siteManager.openEditor(names.resolve(title), await siteManager.contentIdOf(names.resolve(folder)));
    // Start from nothing: clear everything the page has, then set the wanted values.
    await contentEdit.clearCategoriesAndTags();
    if (categories) await contentEdit.assignCategories(list(categories).map((c) => names.resolve(c)));
    if (tags) await contentEdit.addTags(list(tags).map((t) => names.fill(t)));
    await contentEdit.publish();
  },
);

// ---- the public listings ------------------------------------------------------------------

const folderPath = (names: { resolve(n: string): string }, folder: string) => slugOf(names.resolve(folder));
const categoryPath = (names: { resolve(n: string): string }, folder: string, category: string) =>
  `${folderPath(names, folder)}/category/${slugOf(names.resolve(category))}/`;
const tagPath = (names: { resolve(n: string): string; fill(t: string): string }, folder: string, tag: string) =>
  `${folderPath(names, folder)}/tag/${names.fill(tag).toLowerCase()}/`;

Then('the folder {string} lists {string}', async ({ visitor, names }, folder: string, titles: string) => {
  await visitor.expectListing(`${folderPath(names, folder)}/`, list(titles).map((t) => names.resolve(t)));
});

Then('the category {string} of the folder {string} lists {string}', async ({ visitor, names }, category: string, folder: string, titles: string) => {
  await visitor.expectListing(categoryPath(names, folder, category), list(titles).map((t) => names.resolve(t)));
});

Then('the category {string} of the folder {string} does not list {string}', async ({ visitor, names }, category: string, folder: string, titles: string) => {
  await visitor.expectListing(categoryPath(names, folder, category), [], list(titles).map((t) => names.resolve(t)));
});

Then('the tag {string} of the folder {string} lists {string}', async ({ visitor, names }, tag: string, folder: string, titles: string) => {
  await visitor.expectListing(tagPath(names, folder, tag), list(titles).map((t) => names.resolve(t)));
});

Then('the tag {string} of the folder {string} does not list {string}', async ({ visitor, names }, tag: string, folder: string, titles: string) => {
  await visitor.expectListing(tagPath(names, folder, tag), [], list(titles).map((t) => names.resolve(t)));
});
