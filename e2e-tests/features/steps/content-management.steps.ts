import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, Then, When } from '../support/fixtures';
import { ContentDetails } from '../support/pages/content-edit-page';
import { slugOf } from '../support/pages/public-site-page';

const paragraph = (text: string) => `<p>${text}</p>`;

// ---- publishing pages --------------------------------------------------------

When(
  'I publish a page titled {string} with the body {string}',
  async ({ contentEdit, names }, name: string, body: string) => {
    await contentEdit.createAndPublish({ title: names.unique(name), body: paragraph(names.fill(body)) });
  },
);
Given(
  'a page titled {string} with the body {string} is published',
  async ({ contentEdit, names }, name: string, body: string) => {
    await contentEdit.createAndPublish({ title: names.unique(name), body: paragraph(names.fill(body)) });
  },
);

When(
  'I publish a page titled {string} with these details:',
  async ({ contentEdit, names }, name: string, table: DataTable) => {
    const rows = table.rowsHash();
    const details: ContentDetails = { title: names.unique(name) };
    for (const [field, raw] of Object.entries(rows)) {
      const value = names.fill(raw);
      if (field === 'URL title') details.urlTitle = value;
      else if (field === 'HTML title') details.htmlTitle = value;
      else if (field === 'Meta description') details.metaDescription = value;
      else if (field === 'Summary') details.summary = paragraph(value);
      else if (field === 'Body') details.body = value;
      else throw new Error(`Unknown page detail "${field}"`);
    }
    await contentEdit.createAndPublish(details);
  },
);

When(
  'I publish a page titled {string} with a body of {int} characters ending in {string}',
  async ({ contentEdit, names }, name: string, length: number, ending: string) => {
    const filler = 'Lorem ipsum dolor sit amet. '.repeat(Math.ceil(length / 28)).slice(0, length);
    await contentEdit.createAndPublish({ title: names.unique(name), body: paragraph(filler + ending) });
  },
);

When(
  'I publish a page titled {string} under the page {string}',
  async ({ contentEdit, siteManager, names }, name: string, parent: string) => {
    const parentId = await siteManager.contentIdOf(names.resolve(parent));
    await contentEdit.createAndPublish({ title: names.unique(name), parentId });
  },
);

Given(
  'a page titled {string} is published under the page {string}',
  async ({ contentEdit, siteManager, names }, name: string, parent: string) => {
    const parentId = await siteManager.contentIdOf(names.resolve(parent));
    await contentEdit.createAndPublish({ title: names.unique(name), parentId });
  },
);

Given('a page titled {string} is published', async ({ contentEdit, names }, name: string) => {
  await contentEdit.createAndPublish(names.unique(name));
});

When(
  'I publish a page titled {string} to be displayed from {string}',
  async ({ contentEdit, names }, name: string, date: string) => {
    await contentEdit.createAndPublish({ title: names.unique(name), displayStart: date });
  },
);

// ---- drafts ------------------------------------------------------------------

When('I save a draft of a page titled {string}', async ({ contentEdit, names }, name: string) => {
  await contentEdit.openNew('Page');
  await contentEdit.fill({ title: names.unique(name) });
  await contentEdit.saveDraft();
});

When('I publish the page being edited', async ({ contentEdit }) => {
  await contentEdit.publish();
});

When('I open and publish the draft {string}', async ({ siteManager, contentEdit, names }, name: string) => {
  await siteManager.openEditor(names.resolve(name));
  await contentEdit.publishDraft();
});

// ---- other content types -----------------------------------------------------

When('I publish a {word} titled {string}', async ({ contentEdit, names }, type: string, name: string) => {
  await contentEdit.createAndPublish({ title: names.unique(name), type });
});

When(
  'I publish a Link titled {string} pointing to {string}',
  async ({ contentEdit, names }, name: string, url: string) => {
    await contentEdit.createAndPublish({ title: names.unique(name), type: 'Link', linkUrl: url });
  },
);

// ---- public site checks ------------------------------------------------------

When('I open the public path {string}', async ({ publicSite, names }, path: string) => {
  await publicSite.expectPath(names.fill(path));
});

Then('the public path {string} is not found', async ({ publicSite, names }, path: string) => {
  expect(await publicSite.statusOf(names.fill(path))).toBe(404);
});

Then('the browser title contains {string}', async ({ page, names }, text: string) => {
  await expect(page).toHaveTitle(new RegExp(names.fill(text)));
});

Then('the meta description is {string}', async ({ publicSite, names }, text: string) => {
  await publicSite.expectMetaDescription(names.fill(text));
});

Then('the page shows {string}', async ({ publicSite, names }, text: string) => {
  await publicSite.expectText(names.fill(text));
});

Then('the page does not show {string}', async ({ publicSite, names }, text: string) => {
  await publicSite.expectNoText(names.fill(text));
});

Then('the page {string} is listed in the Site Manager', async ({ siteManager, names }, name: string) => {
  await siteManager.contentIdOf(names.resolve(name));
});

Then('the page {string} is not on the public site', async ({ publicSite, names }, name: string) => {
  await publicSite.expectPageGone(names.resolve(name));
});

Then(
  'the page {string} is visible under {string} on the public site',
  async ({ publicSite, names }, child: string, parent: string) => {
    const path = `${slugOf(names.resolve(parent))}/${slugOf(names.resolve(child))}/`;
    await publicSite.expectPath(path);
    await publicSite.expectText(names.resolve(child));
  },
);

Then('the page {string} is visible on the public site as {string}', async ({ publicSite, names }, name: string, path: string) => {
  await publicSite.expectPath(names.fill(path));
  await publicSite.expectText(names.resolve(name));
});

Then(
  'the page {string} shows {string} inside a {string} element',
  async ({ page, publicSite, names }, name: string, text: string, tag: string) => {
    await publicSite.expectPageVisible(names.resolve(name));
    await expect(page.locator(tag, { hasText: text }).first()).toBeVisible();
  },
);

Then(
  'the page {string} redirects visitors to {string}',
  async ({ page, names }, name: string, target: string) => {
    // Masa first redirects to the canonical address, which then redirects to the link target.
    let url = `/index.cfm/${slugOf(names.resolve(name))}/`;
    for (let hop = 0; hop < 3; hop++) {
      const response = await page.request.get(url, { maxRedirects: 0 });
      expect([301, 302, 303, 307, 308], `GET ${url}`).toContain(response.status());
      url = response.headers()['location'];
      if (url === target) return;
    }
    expect(url).toBe(target);
  },
);

// ---- rich text editor --------------------------------------------------------

When('I start a new page titled {string}', async ({ contentEdit, names }, name: string) => {
  await contentEdit.openNew('Page');
  await contentEdit.fillTitle(names.unique(name));
});

When('I type {string} in the body editor', async ({ contentEdit }, text: string) => {
  await contentEdit.typeInBody(text);
});

When('I apply {string} to the body text', async ({ contentEdit }, command: string) => {
  await contentEdit.applyToolbarCommandToBody(command as 'bold');
});

When('I enter this HTML in the body source view:', async ({ contentEdit }, html: string) => {
  await contentEdit.setBodyThroughSourceView(html);
});

// ---- editing and versions ----------------------------------------------------

When(
  'I edit the page {string} and publish it with the body {string}',
  async ({ siteManager, contentEdit, names }, name: string, body: string) => {
    await siteManager.openEditor(names.resolve(name));
    await contentEdit.setBody(paragraph(names.fill(body)));
    await contentEdit.publish();
  },
);

When('I open the version history of the page {string}', async ({ siteManager, names }, name: string) => {
  await siteManager.openVersionHistory(names.resolve(name));
});

Then(
  'the version history lists {int} published and {int} archived versions',
  async ({ siteManager }, published: number, archived: number) => {
    const statuses = await siteManager.versionStatuses();
    expect(statuses.filter((s) => s === 'Published')).toHaveLength(published);
    expect(statuses.filter((s) => s === 'Archived')).toHaveLength(archived);
  },
);

When('I publish the oldest archived version again', async ({ siteManager, contentEdit }) => {
  await siteManager.editArchivedVersion();
  await contentEdit.publish();
});

