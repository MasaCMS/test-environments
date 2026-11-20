import { expect } from '@playwright/test';
import { Then, When } from '../support/fixtures';
import { objectId } from '../support/pages/layout-manager-page';

const labels = (list: string) => list.split(',').map((s) => s.trim()).filter(Boolean);

// ---- inline editing ----------------------------------------------------------

When('I open the page {string} for inline editing', async ({ layout, names }, name: string) => {
  await layout.startInlineEditing(names.resolve(name));
});

Then('the inline editor offers the display objects {string}', async ({ layout }, list: string) => {
  const offered = await layout.offeredObjects();
  for (const label of labels(list)) expect(offered).toContain(label);
});

When('I add the {string} display object', async ({ layout }, label: string) => {
  await layout.addObject(label);
});

When('I add the {string} display object above the {string} display object', async ({ layout }, label: string, other: string) => {
  await layout.addObject(label, { above: other });
});

When('I remove the {string} display object', async ({ layout }, label: string) => {
  await layout.removeObject(label);
});

When('I publish from the inline editor', async ({ layout }) => {
  await layout.publish();
});

Then('the main content region holds the display objects {string}', async ({ layout }, list: string) => {
  expect(await layout.objects()).toEqual(labels(list).map(objectId));
});

// ---- the public page -----------------------------------------------------------

Then(
  'the public page {string} shows the display objects {string}',
  async ({ visitor, names }, name: string, list: string) => {
    expect(await visitor.displayObjects(names.resolve(name))).toEqual(labels(list).map(objectId));
  },
);

Then('the public page {string} shows no display objects', async ({ visitor, names }, name: string) => {
  expect(await visitor.displayObjects(names.resolve(name))).toEqual([]);
});

// ---- collections -----------------------------------------------------------------

When('I show at most {int} items in the Collection display object', async ({ layout }, count: number) => {
  await layout.setCollectionMaxItems(count);
});

Then('the public page {string} lists {int} collection items', async ({ visitor, names }, name: string, count: number) => {
  await visitor.expectPageVisible(names.resolve(name));
  expect(await visitor.collectionItemCount()).toBe(count);
});

When(
  'I create a collection named {string} sorted by {string} {string}',
  async ({ collections, names }, name: string, sortBy: string, direction: string) => {
    await collections.createLocalIndex(names.uniqueWithoutSpaces(name), { sortBy, sortDirection: direction });
  },
);

Then('the collection {string} is listed in the Collections', async ({ collections, names }, name: string) => {
  await collections.expectListed(names.resolve(name));
});

When('I use the collection {string} as the source of the Collection display object', async ({ layout, names }, name: string) => {
  await layout.setCollectionSource(names.resolve(name));
});

Then(
  'the public page {string} lists collection items in ascending title order',
  async ({ visitor, names }, name: string) => {
    await visitor.expectPageVisible(names.resolve(name));
    const titles = await visitor.collectionItemTitles();
    expect(titles.length).toBeGreaterThan(1);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })));
  },
);
