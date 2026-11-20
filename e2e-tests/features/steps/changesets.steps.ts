import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';

// Change set names are made unique per scenario, like page titles.

When('I create a change set named {string}', async ({ changesets, names }, name: string) => {
  await changesets.create(names.unique(name));
});

Given('a change set named {string}', async ({ changesets, names }, name: string) => {
  await changesets.create(names.unique(name));
});

When(
  'I create a change set named {string} to be published on {string}',
  async ({ changesets, names }, name: string, date: string) => {
    await changesets.create(names.unique(name), { publishDate: date });
  },
);

Then('the change set {string} is listed', async ({ changesets, names }, name: string) => {
  await changesets.expectListed(names.resolve(name));
});

Then('the change set {string} shows the publish date {string}', async ({ changesets, names }, name: string, date: string) => {
  expect(await changesets.publishDateInList(names.resolve(name))).toContain(date);
});

When(
  'I save a new page titled {string} to the change set {string}',
  async ({ contentEdit, changesets, names }, title: string, name: string) => {
    await contentEdit.openNew('Page');
    await contentEdit.fill({ title: names.unique(title), body: '<p>Change set content</p>' });
    await changesets.saveEditedContentToChangeset(names.resolve(name));
  },
);

Then('the change set {string} contains the page {string}', async ({ changesets, names }, name: string, title: string) => {
  await changesets.expectAssigned(names.resolve(name), names.resolve(title));
});

Then('the change set {string} no longer contains the page {string}', async ({ changesets, names }, name: string, title: string) => {
  await changesets.expectNotAssigned(names.resolve(name), names.resolve(title));
});

When('I remove the page {string} from the change set {string}', async ({ changesets, names }, title: string, name: string) => {
  await changesets.removeAssignment(names.resolve(name), names.resolve(title));
});

When('I publish the change set {string}', async ({ changesets, names }, name: string) => {
  await changesets.publishNow(names.resolve(name));
});

Then('the change set {string} is published', async ({ changesets, names }, name: string) => {
  await changesets.expectPublished(names.resolve(name));
});

Then(
  'the page {string} is shown in the preview of the change set {string}',
  async ({ publicSite, changesets, names }, title: string, name: string) => {
    const slug = (await import('../support/pages/public-site-page')).slugOf(names.resolve(title));
    await publicSite.expectPath(changesets.previewPath(names.resolve(name), `${slug}/`));
  },
);

Then('the page {string} is not on the public site for a visitor', async ({ visitor, names }, title: string) => {
  const slug = (await import('../support/pages/public-site-page')).slugOf(names.resolve(title));
  expect(await visitor.statusOf(`${slug}/`)).toBe(404);
});

Then('the page {string} is on the public site for a visitor', async ({ visitor, names }, title: string) => {
  await visitor.expectPageVisible(names.resolve(title));
});
