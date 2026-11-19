import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// BASE_URL is set per engine/DB combination by scripts/e2e-matrix.sh.
// Default to the Lucee + MySQL environment.
const baseURL = process.env.BASE_URL || 'http://localhost:18181';

// Gherkin features in features/ are compiled to specs in .features-gen/ by `bddgen`.
const featuresTestDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['features/steps/*.ts', 'features/support/fixtures.ts'],
  outputDir: '.features-gen',
});

export default defineConfig({
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
    { name: 'smoke', testDir: './e2e', use: { ...devices['Desktop Chrome'] } },
    { name: 'features', testDir: featuresTestDir, use: { ...devices['Desktop Chrome'] } },
  ],
});
