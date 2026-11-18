import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const baseURL = process.env.PW_BASE_URL || 'http://localhost:3012';
const statePath = process.env.ADMIN_STATE_OUT || path.join('.qa-temp', 'staging-admin-state.json');

fs.mkdirSync(path.dirname(statePath), { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

try {
  await page.goto(`${baseURL}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log(`Opened ${baseURL}/admin. Sign in to the staging Admin account in the browser window.`);

  await page.getByRole('button', { name: /^Products/ }).waitFor({
    state: 'visible',
    timeout: 480000,
  });

  await context.storageState({ path: statePath });
  console.log(`Authenticated admin state saved to ${statePath}`);
} finally {
  await browser.close();
}
