import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: [
    'qa-browser.spec.ts',
    'qa-metal-integration.spec.ts',
    'qa-service-categories.spec.ts',
  ],
  reporter: 'list',
  // Allow 1 retry to handle transient dev-server hot-reload race conditions.
  retries: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
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

  /* Run web server before starting tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/metal-coating',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
