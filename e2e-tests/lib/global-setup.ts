import { chromium, FullConfig } from '@playwright/test';
import { AUTH_FILE, login } from './helpers';

// Log in once and share the session with all tests via storageState.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await login(page);
  await context.storageState({ path: AUTH_FILE });
  await browser.close();
}
