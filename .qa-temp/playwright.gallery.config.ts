import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['gallery-sync.spec.ts'],
  reporter: 'list',
  timeout: 30000,
  workers: 1,
});
