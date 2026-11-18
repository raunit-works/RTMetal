import { defineConfig, devices } from '@playwright/test';

// Set PW_BASE_URL to run against an already-running server (recommended in this
// environment so no additional dev server is started). When it is not set, the
// config starts a single controlled dev server on port 3010.
const externalBaseUrl = process.env.PW_BASE_URL;
const baseURL = externalBaseUrl ?? 'http://localhost:3010';

export default defineConfig({
  testDir: '.',
  testMatch: [
    'tests/axe-debug.spec.ts',
  ],
  reporter: 'list',
  // Allow 1 retry to handle transient dev-server hot-reload race conditions.
  retries: 1,
  timeout: 45000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    actionTimeout: 15000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Run a single controlled web server unless an external base URL is supplied */
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3010/metal-coating',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: { PORT: '3010' },
      },
});
