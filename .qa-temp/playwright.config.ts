import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..');

export default defineConfig({
  testDir: '.',
  testMatch: ['image-compression.spec.ts', 'public-gallery.spec.ts', 'quick-view-gallery.spec.ts', 'quick-view-responsive.spec.ts'],
  reporter: 'list',
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    cwd: projectRoot,
    url: 'http://localhost:3000/metal-coating',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
