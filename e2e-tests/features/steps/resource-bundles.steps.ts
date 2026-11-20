import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import { expectNoEngineError } from '../../lib/helpers';
import { BUNDLE_TEXT, installBundleTheme } from '../../lib/test-bundles';

const texts = BUNDLE_TEXT as Record<string, string>;

Given('the test theme has resource bundles in English and Dutch', async ({ themes }) => {
  themes.touched = true;
  installBundleTheme();
  await themes.reloadApplication();
});

When('I set the site locale to {string}', async ({ resourceBundles }, locale: string) => {
  await resourceBundles.setSiteLocale(locale);
});

Then('the footer of the public site greets with the {word} bundle text', async ({ resourceBundles, visitorPage }, language: string) => {
  const key = language === 'Dutch' ? 'greetingDutch' : 'greetingEnglish';
  expect(await resourceBundles.footerText(visitorPage, 'greeting')).toBe(texts[key]);
});

Then('the footer of the public site shows the English-only text', async ({ resourceBundles, visitorPage }) => {
  expect(await resourceBundles.footerText(visitorPage, 'onlyenglish')).toBe(BUNDLE_TEXT.onlyEnglish);
});

Then('the public site works although the theme asks for a key that no bundle has', async ({ resourceBundles, visitorPage }) => {
  await resourceBundles.footerText(visitorPage, 'missing');
  await expectNoEngineError(visitorPage);
});
