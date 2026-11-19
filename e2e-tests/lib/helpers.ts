import { expect, Page } from '@playwright/test';

export const ADMIN_USER = process.env.MASA_ADMIN_USER || 'admin';
export const ADMIN_PASSWORD = process.env.MASA_ADMIN_PASSWORD || 'admin';
export const SITE_ID = 'default';
export const SITE_MANAGER_MODULE = '00000000000000000000000000000000000';
export const HOME_CONTENT_ID = '00000000000000000000000000000000001';
export const AUTH_FILE = '.auth/admin.json';

// Text that shows up when the CFML engine renders an error page.
export const ENGINE_ERROR_PATTERNS = [
  /Error Occurred/i,
  /Application\.cfc/i,
  /cfcatch|cfthrow/i,
  /coldfusion\.runtime/i,
  /lucee\.runtime/i,
  /ortus\.boxlang/i,
  /Stacktrace|Stack Trace/i,
  /Variable \[?[A-Za-z_.]+\]? is undefined/i,
];

export async function expectNoEngineError(page: Page) {
  const html = await page.content();
  for (const pattern of ENGINE_ERROR_PATTERNS) {
    expect(html, `page contains engine error matching ${pattern}`).not.toMatch(pattern);
  }
}

export async function login(page: Page) {
  await page.goto('/admin/');
  await page.locator('#username').fill(ADMIN_USER);
  await page.locator('#password').fill(ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL(/muraAction=/),
    page.locator('#loginForm').getByRole('button').first().click(),
  ]);
}

export function siteManagerUrl() {
  return `/admin/?muraAction=cArch.list&siteid=${SITE_ID}&moduleid=${SITE_MANAGER_MODULE}`;
}

export function newPageUrl(type: 'Page' | 'File' = 'Page') {
  return (
    `/admin/?muraAction=cArch.edit&type=${type}&subtype=Default&siteid=${SITE_ID}` +
    `&moduleid=${SITE_MANAGER_MODULE}&parentid=${HOME_CONTENT_ID}&contentid=&startrow=1`
  );
}
