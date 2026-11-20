import { expect } from '@playwright/test';
import { Then, When } from '../support/fixtures';
import { PublicFormPage } from '../support/pages/public-form-page';
import { PublicSitePage } from '../support/pages/public-site-page';

// ---- the public site on a given screen --------------------------------------------------------

When('a visitor with a {string} screen opens the page {string}', async ({ screenVisitor, names }, screen: string, name: string) => {
  const page = await screenVisitor(screen);
  await new PublicSitePage(page).expectPageVisible(names.resolve(name));
});

Then('the wide image of the page fits within the screen', async ({ screenSessions }) => {
  const page = screenSessions.last().page;
  const image = page.locator('img[alt=wide]');
  await expect(image).toBeVisible();
  const box = (await image.boundingBox())!;
  const screenWidth = page.viewportSize()!.width;
  expect(box.x + box.width, 'right edge of the image').toBeLessThanOrEqual(screenWidth);
});

Then('the public page does not scroll sideways', async ({ screenSessions }) => {
  expect(await screenSessions.last().scrollsSideways()).toBe(false);
});

// ---- a form on a phone ----------------------------------------------------------------------

When('a visitor with a phone-sized screen fills in and sends the form on the page {string} with:', async ({ screenVisitor, names }, name: string, table) => {
  const page = await screenVisitor('phone');
  const form = new PublicFormPage(page);
  await form.open(names.resolve(name));
  for (const [label, value] of Object.entries(table.rowsHash() as Record<string, string>)) await form.fill(label, names.fill(value));
  await form.submit();
  await form.expectSubmitted();
});

// ---- the admin on a given screen --------------------------------------------------------------

When('an administrator with a {string} screen opens a new page', async ({ screenAdmin }, screen: string) => {
  const session = await screenAdmin(screen);
  await session.openNewPageEditor();
});

Then('the administrator can type a title for the page', async ({ screenSessions }) => {
  const session = screenSessions.last();
  await session.typeTitle('Typed on a phone');
  expect(await session.titleShown()).toContain('Typed on a phone');
});

Then('the admin does not scroll sideways', async ({ screenSessions }) => {
  expect(await screenSessions.last().scrollsSideways()).toBe(false);
});
