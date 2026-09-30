import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import { AUTH_FILE } from './auth.constants';

/**
 * Participants page header actions:
 *   [Add participant] [Export form answers] [Download travel documents]
 *
 * Auth: session saved by auth.setup.ts (E2E_* env vars, never hard-coded credentials).
 * Mutating tests use a uniquely named disposable participant and always clean it up.
 */

const PARTICIPANTS_PATH =
  process.env.PARTICIPANTS_URL ??
  '/admin/experiences/6a844e22f4c72cccd7a60f35/manage/participants';

test.use({ storageState: AUTH_FILE });
test.setTimeout(90_000); // the RC environment is slow to load; keeps cleanup hooks from being starved

const addBtn = (page: Page) => page.getByRole('button', { name: 'Add participant' });
const exportBtn = (page: Page) => page.getByRole('button', { name: 'Export form answers' });
const docsBtn = (page: Page) => page.getByRole('button', { name: 'Download travel documents' });
const rowFor = (page: Page, text: string | RegExp) => page.getByRole('row').filter({ hasText: text });

test.beforeEach(async ({ page }) => {
  test.skip(!fs.existsSync(AUTH_FILE), 'No saved session – run the setup project with E2E_* env vars');
  await page.goto(PARTICIPANTS_PATH, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Participants', level: 2 })).toBeVisible({ timeout: 30_000 });
  // Wait for the roster to finish loading (header buttons are disabled while it loads)
  await expect(rowFor(page, '@getnada.com').first()).toBeVisible({ timeout: 30_000 });
  await expect(exportBtn(page)).toBeEnabled();
});

async function readDownload(download: import('@playwright/test').Download) {
  const filePath = await download.path();
  return fs.readFileSync(filePath);
}

test.describe('Header buttons – presence & accessibility', () => {
  test('all three buttons are visible, enabled and have accessible names', async ({ page }) => {
    for (const btn of [addBtn(page), exportBtn(page), docsBtn(page)]) {
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
    }
  });

  test('buttons are reachable and operable by keyboard', async ({ page }) => {
    await addBtn(page).focus();
    await expect(addBtn(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(exportBtn(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(docsBtn(page)).toBeFocused();
  });
});

test.describe('Add participant', () => {
  test('dialog opens with Continue disabled until an email is typed; Cancel closes it', async ({ page }) => {
    await addBtn(page).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Add participant' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
  });

  test('cancel does not add anyone', async ({ page }) => {
    const before = await page.getByRole('table').locator('tbody tr').count();
    await addBtn(page).click();
    await page.getByRole('dialog').getByRole('textbox', { name: 'Email' }).fill(`qa.cancel.${Date.now()}@getnada.com`);
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(before);
  });

  test('rejects malformed emails', async ({ page }) => {
    await addBtn(page).click();
    const dialog = page.getByRole('dialog');
    for (const bad of ['not-an-email', 'a@b', '@getnada.com', 'a b@getnada.com']) {
      await dialog.getByRole('textbox', { name: 'Email' }).fill(bad);
      await dialog.getByRole('button', { name: 'Continue' }).click();
      await expect(dialog.getByText('Enter a valid email address')).toBeVisible();
    }
  });

  test('rejects an email that is already on the roster (case-insensitive)', async ({ page }) => {
    await addBtn(page).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Email' }).fill('  JABE@getnada.com ');
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(dialog.getByText('This person is already on the roster.')).toBeVisible();
  });

  test('invite form requires first and last name and blocks deposit above the price', async ({ page }) => {
    await addBtn(page).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Email' }).fill(`qa.form.${Date.now()}@getnada.com`);
    await dialog.getByRole('button', { name: 'Continue' }).click();

    const send = dialog.getByRole('button', { name: 'Send invite' });
    await expect(send).toBeDisabled();
    await dialog.locator('input[name="firstName"]').fill('QAtest');
    await expect(send).toBeDisabled(); // last name still missing
    await dialog.locator('input[name="lastName"]').fill('FormOnly');
    await expect(send).toBeEnabled();

    const deposit = dialog.locator('input[name="costDeposit"]');
    await deposit.fill('20000');
    await deposit.blur(); // validation runs on blur
    await expect(dialog.getByText('Deposit amount must be less than actual cost')).toBeVisible();
    await expect(send).toBeDisabled();

    // Nothing is created: close without sending
    await dialog.getByRole('button', { name: 'Back' }).click();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
  });

  test.describe('create + persist + cleanup', () => {
    const stamp = Date.now().toString(36);
    const email = `qa.${stamp}@getnada.com`;

    test.afterEach(async ({ page }) => {
      // Always sweep disposable participants created by this file, even after a failure
      await page.goto(PARTICIPANTS_PATH, { waitUntil: 'domcontentloaded' });
      await expect(rowFor(page, '@getnada.com').first()).toBeVisible({ timeout: 30_000 });
      const row = rowFor(page, email);
      if (await row.count()) {
        await row.getByRole('button', { name: '•••' }).click();
        await row.getByRole('button', { name: 'Remove' }).click();
        await expect(rowFor(page, email)).toHaveCount(0);
      }
    });

    test('creates one participant (double-click safe), normalises the email and persists after reload', async ({ page }) => {
      await addBtn(page).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('textbox', { name: 'Email' }).fill(`  ${email.toUpperCase()}  `);
      await dialog.getByRole('button', { name: 'Continue' }).click();
      await dialog.locator('input[name="firstName"]').fill('  QAtest  ');
      await dialog.locator('input[name="lastName"]').fill(`Run${stamp}`);

      await dialog.getByRole('button', { name: 'Send invite' }).dblclick();

      await expect(rowFor(page, email)).toHaveCount(1);
      await expect(rowFor(page, email)).toContainText(`QAtest Run${stamp}`);
      await expect(rowFor(page, email)).toContainText('Nothing paid');

      await page.reload();
      await expect(rowFor(page, email)).toHaveCount(1);
    });
  });
});

test.describe('Export form answers', () => {
  test('downloads an .xlsx workbook', async ({ page }) => {
    const [download] = await Promise.all([page.waitForEvent('download'), exportBtn(page).click()]);
    expect(download.suggestedFilename()).toMatch(/Answer Report\.xlsx$/);
    const buf = await readDownload(download);
    expect(buf.subarray(0, 2).toString()).toBe('PK'); // xlsx is a zip container
    expect(buf.includes(Buffer.from('xl/sharedStrings.xml'))).toBe(true);
    expect(buf.includes(Buffer.from('xl/worksheets/sheet1.xml'))).toBe(true);
  });

  test('button stays usable after a download (no stuck loading state)', async ({ page }) => {
    const [download] = await Promise.all([page.waitForEvent('download'), exportBtn(page).click()]);
    await download.path();
    await expect(exportBtn(page)).toBeEnabled();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('Download travel documents', () => {
  test('downloads a dated .zip containing each participant\'s documents named "<Participant> - <Type>.<ext>"', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 90_000 }),
      docsBtn(page).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\d{2}-\d{2}-\d{4}\.zip$/);
    const buf = await readDownload(download);
    expect(buf.subarray(0, 2).toString()).toBe('PK');
    // zip entry names are stored uncompressed, so they can be checked without extra libraries
    for (const entry of ['Pearl Salazaro - Ticket.pdf', 'Pearl Salazaro - Insurance.pdf', 'Pearl Salazaro - Passport.jpg', 'Pearl Salazaro - Headshot.jpg']) {
      expect(buf.includes(Buffer.from(entry)), `zip should contain ${entry}`).toBe(true);
    }
    // participants with no documents must not produce entries
    expect(buf.includes(Buffer.from('Rafael Solomon -'))).toBe(false);
  });
});
