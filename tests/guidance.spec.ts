import { test, expect } from '@playwright/test';

test('terminal settings persist and control hints, motion, and the shortcut guide', async ({
  page,
}) => {
  await page.goto('/');
  const gear = page.getByRole('button', { name: 'Terminal settings', exact: true });
  await gear.click();
  const panel = page.getByRole('region', { name: 'Terminal settings' });
  await expect(page.getByRole('switch', { name: 'Learning hints', exact: true })).toBeFocused();
  await page.getByRole('combobox', { name: 'Nudge delay' }).selectOption('90');
  for (const name of ['Learning hints', 'Stuck nudges', 'Hint animation', 'Shortcut guide']) {
    await page.getByRole('switch', { name, exact: true }).uncheck();
  }
  await expect(page.getByRole('combobox', { name: 'Nudge delay' })).toBeDisabled();
  await panel.press('Escape');
  await expect(panel).not.toBeVisible();
  await expect(gear).toBeFocused();
  await expect(page.getByRole('complementary', { name: 'Terminal know-how' })).not.toBeVisible();
  await expect(page.locator('.terminal-keys')).toHaveCount(0);
  await expect(page.locator('.hint-attention')).toHaveCount(0);
  await page.reload();
  await gear.click();
  for (const name of ['Learning hints', 'Stuck nudges', 'Hint animation', 'Shortcut guide']) {
    await expect(page.getByRole('switch', { name, exact: true })).not.toBeChecked();
  }
  await expect(page.getByRole('combobox', { name: 'Nudge delay' })).toHaveValue('90');
  await page.getByRole('button', { name: 'Close terminal settings' }).click();
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  await expect(page.getByRole('button', { name: 'Need a nudge?' })).not.toBeVisible();
  await gear.click();
  await page.getByRole('switch', { name: 'Learning hints', exact: true }).check();
  await page.getByRole('button', { name: 'Close terminal settings' }).click();
  await expect(page.getByRole('complementary', { name: 'Terminal know-how' })).toBeVisible();
  await page.getByRole('button', { name: 'Need a nudge?' }).click();
  await expect(
    page.getByText('The path it prints is your location', { exact: false }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('a quiet mission gets one optional nudge; typing resets the timer and completing stops it', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await page.clock.fastForward(30000);
  await input.fill('pw');
  await page.clock.fastForward(30000);
  const nudge = page.getByRole('status', { name: 'Learning nudge' });
  await expect(nudge).not.toBeVisible();
  await page.clock.fastForward(16000);
  await expect(nudge).toBeVisible();
  await expect(
    page.getByText('The path it prints is your location', { exact: false }),
  ).not.toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await input.fill('p');
  await expect(nudge).not.toBeVisible();
  await page.clock.fastForward(120000);
  await expect(nudge).not.toBeVisible();
  await input.fill('pwd');
  await input.press('Enter');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '14');
  await page.clock.fastForward(120000);
  await expect(nudge).not.toBeVisible();
});

test('nudges can be disabled or delayed, respect reduced motion, and reveal hints only on request', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  await expect(page.getByRole('button', { name: 'Need a nudge?' }).locator('svg')).toHaveCSS(
    'animation-name',
    'none',
  );
  const gear = page.getByRole('button', { name: 'Terminal settings', exact: true });
  await gear.click();
  await page.getByRole('switch', { name: 'Stuck nudges', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Close terminal settings' }).click();
  await page.clock.fastForward(120000);
  const nudge = page.getByRole('status', { name: 'Learning nudge' });
  await expect(nudge).not.toBeVisible();
  await gear.click();
  await page.getByRole('switch', { name: 'Stuck nudges', exact: true }).check();
  await page.getByRole('combobox', { name: 'Nudge delay' }).selectOption('90');
  await page.getByRole('button', { name: 'Close terminal settings' }).click();
  await page.clock.fastForward(89000);
  await expect(nudge).not.toBeVisible();
  await page.clock.fastForward(2000);
  await expect(nudge).toBeVisible();
  await page.getByRole('button', { name: 'Show a hint', exact: true }).click();
  await expect(
    page.getByText('The path it prints is your location', { exact: false }),
  ).toBeVisible();
  await expect(nudge).not.toBeVisible();
});

test('page visibility changes pause the idle timer', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  // Headless Chromium keeps pages visible even when another test tab is frontmost.
  // Drive the browser lifecycle signal explicitly instead of relying on OS tabs.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(60000);
  const nudge = page.getByRole('status', { name: 'Learning nudge' });
  await expect(nudge).not.toBeVisible();
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(46000);
  await expect(nudge).toBeVisible();
});
