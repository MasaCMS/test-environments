import { defineConfig, devices } from '@playwright/test';

// BASE_URL is set per engine/DB combination by scripts/e2e-matrix.sh.
// Default to the Lucee + MySQL environment.
const baseURL = process.env.BASE_URL || 'http://localhost:18181';

export default defineConfig({
  testDir: './e2e',
  // All tests share one CMS instance and its content tree: run serially.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
