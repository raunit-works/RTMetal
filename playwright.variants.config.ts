import { defineConfig } from '@playwright/test';

// Set PW_BASE_URL to run against an already-running server so no additional dev
// server is started. Otherwise a single controlled server is started on 3010.
const externalBaseUrl = process.env.PW_BASE_URL;
const baseURL = externalBaseUrl ?? 'http://localhost:3010';

export default defineConfig({
  testDir: './tests',
  testMatch: /product-variants.*\.spec\.ts/,
  // Keep variant runs out of the shared test-results folder so they never
  // overwrite artefacts produced by the main QA suite.
  outputDir: './test-results/variants',
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL,
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3010/dev/product-variants-harness',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: { PORT: '3010' },
      },
});
