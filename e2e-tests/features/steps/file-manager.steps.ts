import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DataTable } from 'playwright-bdd';
import { Given, Then, When } from '../support/fixtures';
import { Area } from '../support/pages/file-browser-page';

const fixtureBytes = (name: string) => readFileSync(join(__dirname, '../../fixtures', name));

// File names stay readable in the scenarios; the real name gets a unique suffix.
const real = (names: { fill(text: string): string }, name: string) => {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return name; // a folder that Masa already has
  return names.fill(`${name.slice(0, dot)}-<unique>${name.slice(dot)}`);
};

Given('I am in the file browser', async ({ fileBrowser }) => {
  await fileBrowser.open();
});

When('I open the file browser area {string}', async ({ fileBrowser }, area: string) => {
  await fileBrowser.open(area as Area);
});

// Rows: fixture file, name to show it under.
When('I upload these files:', async ({ fileBrowser, names }, table: DataTable) => {
  for (const [fixture, name] of Object.entries(table.rowsHash())) {
    await fileBrowser.upload(fixture, real(names, name));
  }
});

When('I upload the fixture {string} as {string}', async ({ fileBrowser, names }, fixture: string, name: string) => {
  await fileBrowser.upload(fixture, real(names, name));
});

Given('the fixture {string} is uploaded as {string}', async ({ fileBrowser, names }, fixture: string, name: string) => {
  await fileBrowser.open();
  await fileBrowser.upload(fixture, real(names, name));
});

Then('the file browser lists {string}', async ({ fileBrowser, names }, list: string) => {
  for (const name of list.split(',').map((n) => n.trim())) {
    await expect.poll(() => fileBrowser.listsName(real(names, name)), { message: `${name} is listed` }).toBe(true);
  }
});

Then('the file browser does not list {string}', async ({ fileBrowser, names }, name: string) => {
  await expect.poll(() => fileBrowser.listsName(real(names, name)), { message: `${name} is not listed` }).toBe(false);
});

When('I filter the file list by {string}', async ({ fileBrowser, names }, text: string) => {
  await fileBrowser.filter(names.fill(text));
});

Then('only {string} is listed', async ({ fileBrowser, names }, name: string) => {
  await expect.poll(() => fileBrowser.names()).toEqual([real(names, name)]);
});

When('I open the file {string}', async ({ fileBrowser, names }, name: string) => {
  await fileBrowser.openFile(real(names, name));
});

When('I rename the open file to {string}', async ({ fileBrowser, names }, base: string) => {
  await fileBrowser.rename(names.fill(base));
});

When('I delete the open file', async ({ fileBrowser }) => {
  await fileBrowser.deleteOpenFile();
});

When('I close the file window', async ({ fileBrowser }) => {
  await fileBrowser.close();
});

Then('the file window shows the dimensions {string}', async ({ fileBrowser }, dimensions: string) => {
  await expect.poll(() => fileBrowser.dimensions()).toBe(dimensions);
});

Then('the downloaded file is identical to the fixture {string}', async ({ fileBrowser }, fixture: string) => {
  expect((await fileBrowser.download()).equals(fixtureBytes(fixture))).toBe(true);
});

Then('the picture of the open file can be loaded from its address', async ({ fileBrowser, page }) => {
  const address = await fileBrowser.pictureAddress();
  const response = await page.request.get(new URL(address, page.url()).toString());
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^image\//);
});

// ---- text files ------------------------------------------------------------------------

When('I open the text file {string}', async ({ fileBrowser, names }, name: string) => {
  await fileBrowser.openTextFile(real(names, name));
});

When('I replace the text with {string}', async ({ fileBrowser }, text: string) => {
  await fileBrowser.replaceText(text);
});

Then('the text file shows {string}', async ({ fileBrowser }, text: string) => {
  expect(await fileBrowser.textContent()).toContain(text);
});

// ---- image editor ----------------------------------------------------------------------

When('I edit the image', async ({ fileBrowser }) => {
  await fileBrowser.editImage();
});

When('I rotate the image to the right', async ({ fileBrowser }) => {
  await fileBrowser.rotateRight();
});

When('I rotate the image to the left', async ({ fileBrowser }) => {
  await fileBrowser.rotateLeft();
});

When('I resize the image to {int} by {int} pixels', async ({ fileBrowser }, width: number, height: number) => {
  await fileBrowser.resize(width, height);
});

When('I go back from the image editor', async ({ fileBrowser }) => {
  await fileBrowser.backFromEditor();
});

// The size under the picture only changes when the file is opened again.
When('I open the file {string} again', async ({ fileBrowser, names }, name: string) => {
  await fileBrowser.open();
  await fileBrowser.openFile(real(names, name));
});

// ---- folders ---------------------------------------------------------------------------

When('I create the folder {string}', async ({ fileBrowser, names }, name: string) => {
  await fileBrowser.createFolder(names.unique(name).replace(/\s+/g, '-'));
});

When('I open the folder {string}', async ({ fileBrowser, names }, name: string) => {
  await fileBrowser.filter(names.resolve(name).replace(/\s+/g, '-'));
  await fileBrowser.openFolder(names.resolve(name).replace(/\s+/g, '-'));
});

Then('the folder {string} is listed', async ({ fileBrowser, names }, name: string) => {
  await expect.poll(() => fileBrowser.listsName(names.resolve(name).replace(/\s+/g, '-'))).toBe(true);
});

// ---- the file browser in the editor ----------------------------------------------------------

When(
  'I start a new page titled {string} and insert the image {string} from the file browser',
  async ({ contentEdit, names }, title: string, file: string) => {
    await contentEdit.openNew('Page');
    await contentEdit.fillTitle(names.unique(title));
    await contentEdit.insertImageFromFileBrowser(real(names, file), 'Picture from the file browser');
  },
);

When(
  'I start a new page titled {string} with the text {string} linked to the file {string} from the file browser',
  async ({ contentEdit, names }, title: string, text: string, file: string) => {
    await contentEdit.openNew('Page');
    await contentEdit.fillTitle(names.unique(title));
    await contentEdit.typeAndSelectBodyText(text);
    await contentEdit.linkSelectionToFileFromFileBrowser(real(names, file));
  },
);

Then('the body of the page being edited contains {string}', async ({ contentEdit, names }, text: string) => {
  expect(await contentEdit.bodyHtml()).toContain(names.fill(text));
});

Then('the public page {string} shows the image {string}', async ({ visitor, names }, title: string, file: string) => {
  await visitor.expectImageShown(names.resolve(title), real(names, file));
});

Then('the public page {string} has a working link to {string}', async ({ visitor, names }, title: string, file: string) => {
  await visitor.expectPageVisible(names.resolve(title));
  await visitor.expectLinkServesFile(real(names, file));
});
