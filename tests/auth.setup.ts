import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { AUTH_FILE } from './auth.constants';

/**
 * Logs in once and stores the session for specs that opt in with
 * test.use({ storageState: AUTH_FILE }).
 *
 * Credentials come from the environment (never hard-coded):
 *   E2E_EMAIL, E2E_PASSWORD, E2E_2FA_CODE
 */
setup('authenticate admin', async ({ page }) => {
  const { E2E_EMAIL, E2E_PASSWORD, E2E_2FA_CODE } = process.env;
  setup.skip(!E2E_EMAIL || !E2E_PASSWORD || !E2E_2FA_CODE, 'E2E_EMAIL / E2E_PASSWORD / E2E_2FA_CODE not set');

  await page.goto('/admin/home');
  await page.getByRole('textbox', { name: 'EMAIL' }).fill(E2E_EMAIL!);
  await page.getByRole('textbox', { name: 'PASSWORD' }).fill(E2E_PASSWORD!);
  await page.getByRole('button', { name: 'SIGN IN' }).click();

  // OTP inputs are disabled until the page has finished loading
  const first = page.getByRole('textbox', { name: /Digit 1/ });
  await expect(first).toBeEnabled({ timeout: 30_000 });
  const code = E2E_2FA_CODE!.split('');
  for (let i = 0; i < code.length; i++) {
    await page.getByRole('textbox', { name: i === 0 ? /Digit 1/ : `Digit ${i + 1}` }).fill(code[i]);
  }
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.waitForURL(/rc-admin\.abroad\.io\/admin\//, { timeout: 30_000 });

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
