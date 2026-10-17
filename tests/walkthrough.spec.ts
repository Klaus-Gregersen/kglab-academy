import { test, expect, type Page } from '@playwright/test';

const progressKey = 'kglab:terminal-fundamentals:v1';
async function run(page: Page, command: string) {
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill(command);
  await input.press('Enter');
}

test('watch, pause and replay without changing practice state, draft, history or progress', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  await expect(page.locator('.mission-command-intro')).toContainText('pwd');
  await expect(page.locator('.mission-command-intro')).toContainText('Print working directory');
  await run(page, 'mkdir scratchpad');
  const before = await page.evaluate((key) => localStorage.getItem(key), progressKey);
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill('my unfinished command');
  await page.getByRole('button', { name: 'Watch walkthrough for Where Am I?' }).click();
  const demo = page.getByRole('dialog', { name: 'Where Am I?' });
  await expect(demo).toBeVisible();
  await demo.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await demo.locator('.demo-screen').textContent();
  await page.clock.runFor(5000);
  expect(await demo.locator('.demo-screen').textContent()).toBe(paused);
  await demo.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.runFor(5000);
  await expect(demo.getByText('Example complete', { exact: true })).toBeVisible();
  await expect(demo.locator('.demo-screen')).toContainText('/home/learner');
  await demo.getByRole('button', { name: 'Replay', exact: true }).click();
  await expect(demo.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.clock.runFor(5000);
  await expect(demo.getByText('Example complete', { exact: true })).toBeVisible();
  await page.clock.fastForward(60000);
  await expect(page.getByRole('status', { name: 'Learning nudge' })).not.toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), progressKey)).toBe(before);
  await demo.getByRole('button', { name: 'Try it myself' }).click();
  await expect(demo).not.toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('my unfinished command');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('mkdir scratchpad');
  await input.press('ArrowDown');
  await expect(input).toHaveValue('my unfinished command');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
});

test('reduced-motion learners get a full readable example, even with optional hints disabled', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  await page.getByRole('button', { name: 'Terminal settings', exact: true }).click();
  await page.getByRole('switch', { name: 'Learning hints', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Close terminal settings' }).click();
  const objective = page.getByRole('button', { name: 'Watch walkthrough for Where Am I?' });
  await objective.click();
  const demo = page.getByRole('dialog', { name: 'Where Am I?' });
  await expect(demo.getByText('Reduced motion: showing the full example.')).toBeVisible();
  await expect(demo.locator('.demo-transcript')).toHaveAttribute('open', '');
  await expect(demo.getByRole('button', { name: 'Pause', exact: true })).not.toBeVisible();
  await expect(demo.locator('.demo-transcript')).toContainText('type pwd and press Enter');
  await expect(demo.locator('.demo-transcript')).toContainText('/home/learner');
  expect(await demo.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await demo.press('Escape');
  await expect(demo).not.toBeVisible();
  await expect(objective).toBeFocused();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
});

test('tips are collapsed and a whole navigation mission can be watched before practice', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.coach-expanded')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show terminal tips', exact: true }).click();
  await expect(page.locator('.coach-expanded')).toBeVisible();
  await page.getByRole('button', { name: 'Hide terminal tips', exact: true }).click();
  await expect(page.locator('.coach-expanded')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  await run(page, 'pwd');
  await page.getByRole('button', { name: 'Next mission' }).click();
  await run(page, 'ls');
  await page.getByRole('button', { name: 'Next mission' }).click();
  await page.getByRole('button', { name: 'Watch walkthrough for Moving Around' }).click();
  const demo = page.getByRole('dialog', { name: 'Moving Around' });
  await demo.locator('summary').click();
  await expect(demo.locator('.demo-transcript li')).toHaveCount(4);
  await expect(demo.locator('.demo-transcript')).toContainText('cd projects');
  await expect(demo.locator('.demo-transcript')).toContainText('/home/learner/projects');
  await demo.getByRole('button', { name: 'Try it myself' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '29');
  const current = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).machine.cwd,
    progressKey,
  );
  expect(current).toBe('/home/learner');
  await run(page, 'cd projects');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '43');
});
