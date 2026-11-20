import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, Then, When } from '../support/fixtures';
import { slugOf } from '../support/pages/public-site-page';
import { appendThemeCss, CUSTOM_TEMPLATE_MARKER, installTestTheme, TEST_THEME, THEME_MARKER } from '../../lib/test-theme';

// ---- installing a theme -----------------------------------------------------------

Given('the test theme is in the themes folder', async ({ themes }) => {
  themes.touched = true;
  installTestTheme();
  await themes.reloadApplication();
});

Given('the site uses the test theme', async ({ themes }) => {
  await themes.select(TEST_THEME);
});

When('I select the theme {string} in the site settings', async ({ themes }, theme: string) => {
  await themes.select(theme);
});

When('I reload the application to load the theme again', async ({ themes }) => {
  await themes.reloadApplication();
});

Then('the site settings offer the themes {string}', async ({ themes }, list: string) => {
  const offered = await themes.offeredThemes();
  for (const theme of list.split(',').map((t) => t.trim())) expect(offered).toContain(theme);
});

Then('the site settings show the theme {string} as selected', async ({ themes }, theme: string) => {
  expect(await themes.currentTheme()).toBe(theme);
});

// ---- the public site ---------------------------------------------------------------

Then('the home page of the public site shows the test theme', async ({ visitor }) => {
  await visitor.expectPath('');
  await visitor.expectText(THEME_MARKER);
  await visitor.expectElement('link[href*="/themes/e2etheme/"]');
});

Then('the home page of the public site does not show the test theme', async ({ visitor }) => {
  await visitor.expectPath('');
  await visitor.expectNoText(THEME_MARKER);
  await visitor.expectNoElement('link[href*="/themes/e2etheme/"]');
});

// ---- templates -----------------------------------------------------------------------

Then('the page templates offered include {string}', async ({ themes }, list: string) => {
  const offered = await themes.offeredTemplates();
  for (const template of list.split(',').map((t) => t.trim())) expect(offered).toContain(template);
});

Then('the page templates offered do not include {string}', async ({ themes }, template: string) => {
  expect(await themes.offeredTemplates()).not.toContain(template);
});

When('I publish a page titled {string} with the template {string}', async ({ contentEdit, names }, name: string, template: string) => {
  await contentEdit.createAndPublish({ title: names.unique(name), template, body: '<p>Template test</p>' });
});

When(
  'I publish a page titled {string} under the page {string} without choosing a template',
  async ({ contentEdit, siteManager, names }, name: string, parent: string) => {
    const parentId = await siteManager.contentIdOf(names.resolve(parent));
    await contentEdit.createAndPublish({ title: names.unique(name), parentId, body: '<p>Template test</p>' });
  },
);

Then('the public page {string} has a sidebar', async ({ visitor, names }, name: string) => {
  await visitor.expectPageVisible(names.resolve(name));
  await visitor.expectElement('aside.sidebar');
});

Then('the public page {string} has no sidebar', async ({ visitor, names }, name: string) => {
  await visitor.expectPageVisible(names.resolve(name));
  await visitor.expectNoElement('aside.sidebar');
});

// The blank template renders only the body, so the page has no title to check.
Then('the public page {string} has no site navigation', async ({ visitor, names }, name: string) => {
  await visitor.expectPath(`${slugOf(names.resolve(name))}/`);
  await visitor.expectNoElement('nav.navbar');
  await visitor.expectText('Template test');
});

Then('the child page {string} of {string} has no sidebar', async ({ visitor, names }, child: string, parent: string) => {
  await visitor.expectPath(`${slugOf(names.resolve(parent))}/${slugOf(names.resolve(child))}/`);
  await visitor.expectNoElement('aside.sidebar');
});

Then('the public page {string} has site navigation', async ({ visitor, names }, name: string) => {
  await visitor.expectPageVisible(names.resolve(name));
  await visitor.expectElement('nav.navbar');
});

Then('the public page {string} is rendered by the custom landing template', async ({ visitor, names }, name: string) => {
  await visitor.expectPageVisible(names.resolve(name));
  await visitor.expectElement('#e2e-landing-template');
  await visitor.expectText(CUSTOM_TEMPLATE_MARKER);
  await visitor.expectText('Template test');
});

// ---- customisation ---------------------------------------------------------------------

When('I add this rule to the test theme\'s stylesheet:', async ({}, rule: string) => {
  appendThemeCss(rule);
});

Then('the theme marker on the home page has the colour {string}', async ({ visitor }, color: string) => {
  await visitor.expectPath('');
  expect(await visitor.colorOf('#e2e-theme-marker')).toBe(color);
});

// ---- responsive display ------------------------------------------------------------------

When('a visitor with a phone-sized screen opens the page {string}', async ({ phoneVisitor, names }, name: string) => {
  await phoneVisitor.expectPageVisible(names.resolve(name));
});

Then('the page does not scroll sideways', async ({ phoneVisitor }) => {
  expect(await phoneVisitor.scrollsSideways()).toBe(false);
});

Then('the navigation menu is collapsed behind a menu button', async ({ phoneVisitor }) => {
  expect(await phoneVisitor.isShown('.navbar-toggler')).toBe(true);
});

Then('a visitor with a desktop-sized screen sees the navigation menu without a menu button of the page {string}', async ({ visitor, names }, name: string) => {
  await visitor.expectPageVisible(names.resolve(name));
  expect(await visitor.isShown('.navbar-toggler')).toBe(false);
});
