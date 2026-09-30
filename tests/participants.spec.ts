import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import { AUTH_FILE } from './auth.constants';

/**
 * Experience > Manage > Participants
 *
 * Auth: uses the session saved by auth.setup.ts (credentials come from E2E_* env vars, never from code).
 * Optional: PARTICIPANTS_URL (defaults to the RC experience used during exploratory QA).
 *
 * The suite never touches the pre-existing participants. Mutating tests create a
 * uniquely named disposable participant and always remove it in afterEach.
 */

const PARTICIPANTS_PATH =
  process.env.PARTICIPANTS_URL ??
  '/admin/experiences/6a844e22f4c72cccd7a60f35/manage/participants';

test.use({ storageState: AUTH_FILE });
test.setTimeout(90_000); // the RC environment is slow to load; keeps cleanup hooks from being starved

async function login(page: Page) {
  test.skip(!fs.existsSync(AUTH_FILE), 'No saved session – run the setup project with E2E_* env vars');
  await page.goto(PARTICIPANTS_PATH, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Participants', level: 2 })).toBeVisible({ timeout: 30_000 });
  // Wait for the roster to finish loading
  await expect(rowFor(page, '@getnada.com').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Export form answers' })).toBeEnabled();
}

const rowFor = (page: Page, text: string | RegExp) => page.getByRole('row').filter({ hasText: text });

async function openRowMenu(page: Page, email: string) {
  await rowFor(page, email).getByRole('button', { name: '•••' }).click();
}

test.describe('Participants – read-only', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('summary cards reconcile with the table', async ({ page }) => {
    const body = page.getByRole('table').locator('tbody tr');
    await expect(body.first()).toBeVisible();
    const rowCount = await body.count();

    await expect(page.getByText(new RegExp(`of ${rowCount} people`))).toBeVisible();

    // Outstanding = sum of (price - paid) for under-paid participants only (overpaid are not negative).
    const payments = await body.locator('td:nth-child(2)').allInnerTexts();
    const money = (s: string) => Number(s.replace(/[^0-9]/g, ''));
    const outstanding = payments
      .map((p) => p.match(/\$([\d,]+) of \$([\d,]+)/))
      .filter((m): m is RegExpMatchArray => !!m)
      .reduce((sum, m) => sum + Math.max(0, money(m[2]) - money(m[1])), 0);
    await expect(page.getByText(`$${outstanding.toLocaleString('en-US')}`, { exact: true })).toBeVisible();
  });

  test('sorting by Name toggles order', async ({ page }) => {
    const names = async () =>
      (await page.getByRole('table').locator('tbody tr td:first-child a').allInnerTexts()).filter((t) => !t.includes('@'));
    const header = page.getByRole('columnheader', { name: 'Name' });
    await header.click();
    const first = await names();
    await header.click();
    const second = await names();
    expect(second).toEqual([...first].reverse());
  });

  test('sorting by Signup Date orders chronologically both ways', async ({ page }) => {
    const dates = async () =>
      (await page.getByRole('table').locator('tbody tr td:nth-child(8)').allInnerTexts()).map((d) => Date.parse(d));
    const header = page.getByRole('columnheader', { name: 'Signup Date' });
    await header.click();
    const a = await dates();
    await header.click();
    const b = await dates();
    const sorted = [...a].sort((x, y) => x - y);
    const [asc, desc] = a[0] <= a[a.length - 1] ? [a, b] : [b, a];
    expect(asc).toEqual(sorted);
    expect(desc).toEqual([...sorted].reverse());
  });

  test('enrollment form opens for the selected participant and closes back to the list', async ({ page }) => {
    const row = rowFor(page, 'Pearl Salazaro');
    await row.getByRole('button', { name: 'View', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Pearl Salazaro' })).toBeVisible();
    await expect(dialog.getByText('pesaro@getnada.com')).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/manage\/participants$/);
  });

  test('travel document viewer shows the right participant and file', async ({ page }) => {
    const row = rowFor(page, 'Pearl Salazaro');
    await row.getByRole('button', { name: 'View Headshot' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Headshot' })).toBeVisible();
    await expect(dialog.getByText('Pearl Salazaro')).toBeVisible();
    await expect(dialog.getByText(/^headshot-.*\.jpg$/)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('individual document download is named after the participant', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      rowFor(page, 'Pearl Salazaro').getByRole('button', { name: 'Download Headshot' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/Pearl Salazaro - Headshot\.jpg$/);
  });

  test('Download travel documents returns a zip', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60_000 }),
      page.getByRole('button', { name: 'Download travel documents' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });

  test('Export form answers returns an xlsx', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export form answers' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/Answer Report\.xlsx$/);
  });

  test('action menu opens for the right row and closes on Escape', async ({ page }) => {
    await openRowMenu(page, 'pesaro@getnada.com');
    const row = rowFor(page, 'pesaro@getnada.com');
    for (const item of ['Resend Invitation Email', 'Copy Invitation Link', 'Manual Payment', 'Update Payment', 'Remove']) {
      await expect(row.getByRole('button', { name: item })).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(row.getByRole('button', { name: 'Remove' })).toBeHidden();
  });

  test('Add participant dialog validates email and blocks duplicates', async ({ page }) => {
    await page.getByRole('button', { name: 'Add participant' }).click();
    const dialog = page.getByRole('dialog');
    const email = dialog.getByRole('textbox', { name: 'Email' });

    await email.fill('not-an-email');
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(dialog.getByText('Enter a valid email address')).toBeVisible();

    await email.fill('jabe@getnada.com');
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(dialog.getByText('This person is already on the roster.')).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
  });

  test('Add participant is keyboard operable and returns focus on Escape', async ({ page }) => {
    const add = page.getByRole('button', { name: 'Add participant' });
    await add.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(add).toBeFocused();
  });
});

test.describe('Participants – disposable participant lifecycle', () => {
  const stamp = Date.now().toString(36);
  const email = `qa.${stamp}@getnada.com`;
  const lastName = `Run${stamp}`;

  test.beforeEach(async ({ page }) => login(page));

  test.afterEach(async ({ page }) => {
    // Cleanup: remove the disposable participant if it is still listed.
    await page.goto(PARTICIPANTS_PATH, { waitUntil: 'domcontentloaded' });
    await expect(rowFor(page, '@getnada.com').first()).toBeVisible({ timeout: 30_000 });
    const row = rowFor(page, email);
    if (await row.count()) {
      await openRowMenu(page, email);
      await row.getByRole('button', { name: 'Remove' }).click();
      await expect(rowFor(page, email)).toHaveCount(0);
    }
  });

  test('invite, record manual payment, copy link, then remove', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Invite
    await page.getByRole('button', { name: 'Add participant' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Email' }).fill(email);
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await dialog.locator('input[name="firstName"]').fill('QAtest');
    await dialog.locator('input[name="lastName"]').fill(lastName);
    await dialog.getByRole('button', { name: 'Send invite' }).click();

    const row = rowFor(page, email);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Nothing paid');

    // Persists after reload
    await page.reload();
    await expect(rowFor(page, email)).toBeVisible();

    // Zero amount is rejected by the API (no UI message today – see defect DEF-03)
    await openRowMenu(page, email);
    await rowFor(page, email).getByRole('button', { name: 'Manual Payment' }).click();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog.getByText('Amount is required.')).toBeVisible();
    await expect(dialog.getByText('Payment method is required.')).toBeVisible();

    // Valid payment
    await dialog.locator('input').first().fill('2500');
    await dialog.getByText('Select payment method').click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter'); // second option (ACH) – no real card is used
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
    await expect(rowFor(page, email)).toContainText('$2,500 of $10,000');

    await page.reload();
    await expect(rowFor(page, email)).toContainText('$2,500 of $10,000');

    // Copy invitation link: verify destination + participant association, never log the token
    await openRowMenu(page, email);
    await rowFor(page, email).getByRole('button', { name: 'Copy Invitation Link' }).click();
    await expect(page.getByText('Invitation link copied successfully.')).toBeVisible();
    const link = new URL(await page.evaluate(() => navigator.clipboard.readText()));
    expect(link.host).toBe('rc.abroad.io');
    expect(link.pathname).toBe('/account');
    expect(link.searchParams.get('email')).toBe(email);
    expect(link.searchParams.get('fname')).toBe('QAtest');
    expect(link.searchParams.get('lname')).toBe(lastName);
    expect(link.searchParams.get('token')).toBeTruthy();

    // Remove (currently no confirmation dialog – see defect DEF-01)
    await openRowMenu(page, email);
    await rowFor(page, email).getByRole('button', { name: 'Remove' }).click();
    await expect(rowFor(page, email)).toHaveCount(0);
    await page.reload();
    await expect(rowFor(page, email)).toHaveCount(0);
  });
});
