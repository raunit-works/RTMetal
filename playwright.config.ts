import { defineConfig, devices } from '@playwright/test';

// Set PW_BASE_URL to run against an already-running server (recommended in this
// environment so no additional dev server is started). When it is not set, the
// config starts a single controlled dev server on port 3010.
const externalBaseUrl = process.env.PW_BASE_URL;
const baseURL = externalBaseUrl ?? 'http://localhost:3010';

export default defineConfig({
  testDir: '.',
  testMatch: [
    'image-url-normalization.spec.ts',
    'image-rendering.spec.ts',
    'product-enquiry-message.spec.ts',
    'enquiry-action.spec.ts',
    'tests/accessibility.spec.ts',
    'tests/responsive-viewports.spec.ts',
    'qa-browser.spec.ts',
    'qa-metal-integration.spec.ts',
    'qa-service-categories.spec.ts',
    'tests/admin-product-edit.spec.ts',
    'tests/enquiry-validation.spec.ts',
    'tests/product-detail-formatting.spec.ts',
    'tests/product-detail-page.spec.ts',
    'tests/admin-product-pin.spec.ts',
    'tests/transformation-enquiry.spec.ts',
    'tests/admin-inquiry-email.spec.ts',
    'tests/whatsapp-routing.spec.ts',
    'tests/public-collection-order.spec.ts',
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
