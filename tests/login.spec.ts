import { test, expect } from '@playwright/test';

test('admin login page loads', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Abroad/i);
});
