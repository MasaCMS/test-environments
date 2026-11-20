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

// Everything a run produces goes to reports/<engine>-<db>/ (set by e2e-matrix.sh):
//   html/      the HTML report, with the screenshots, videos and traces attached
//   evidence/  the same screenshots, videos and traces as plain files
// EVIDENCE=1 captures a screenshot and video of every test, for documentation.
// Without it, only failing tests are captured.
const evidence = process.env.EVIDENCE === '1';

// BROWSER=firefox or BROWSER=webkit runs the tests in that browser instead of Chrome.
const browserDevices = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
} as const;
const browser = (process.env.BROWSER || 'chromium') as keyof typeof browserDevices;
if (!(browser in browserDevices)) throw new Error(`BROWSER must be one of: ${Object.keys(browserDevices).join(', ')}`);

export default defineConfig({
  outputDir: 'reports/local/evidence',
  // All tests share one CMS instance and its content tree: run serially.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'reports/local/html' }]],
  globalSetup: './lib/global-setup.ts',
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    trace: evidence ? 'on' : 'retain-on-failure',
    screenshot: evidence ? 'on' : 'only-on-failure',
    video: evidence ? 'on' : 'off',
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'smoke', testDir: './smoke', use: { ...browserDevices[browser] } },
    { name: 'features', testDir: featuresTestDir, use: { ...browserDevices[browser] } },
    // Probes that assert the behaviour of known findings (RESULTS.md); run on their own: --project=findings
    { name: 'findings', testDir: './findings', use: { ...browserDevices[browser] } },
  ],
});
