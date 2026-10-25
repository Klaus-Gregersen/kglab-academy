import { test, expect, type Page } from '@playwright/test';
import { missions } from '../src/courses/terminal-fundamentals';
import { execute } from '../src/engine/commands';
import { advance, applyResult, freshProgress, STORAGE_KEY } from '../src/state/progress';

async function command(page: Page, line: string) {
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill(line);
  await input.press('Enter');
}

test('a completed course can be practiced from its first lesson without replacing the saved course', async ({
  page,
}) => {
  let graduate = { ...freshProgress(), started: true };
  for (const mission of missions) {
    for (const line of mission.solution)
      graduate = applyResult(graduate, execute(graduate.machine, line));
    graduate = advance(graduate);
  }
  await page.goto('/');
  await page.evaluate(({ key, saved }) => localStorage.setItem(key, JSON.stringify(saved)), {
    key: STORAGE_KEY,
    saved: graduate,
  });
  await page.goto('/#academy');
  await page.reload();
  const savedBefore = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  await page.getByRole('button', { name: 'Revisit your terminal' }).click();
  await expect(page.getByRole('heading', { name: 'Where Am I?', exact: true })).toBeFocused();
  await expect(page.getByRole('region', { name: 'Mission practice' })).toBeVisible();
  await expect(page.getByText('Practice complete. Nicely done.')).not.toBeVisible();
  await command(page, 'pwd');
  await expect(page.getByText('Practice complete. Nicely done.')).toBeVisible();
  await expect(page.locator('.terminal-body')).toContainText('/home/learner');
  await command(page, 'mkdir practice-only');
  await page
    .locator('#mission-brief')
    .screenshot({ path: test.info().outputPath('mission-practice.png') });
  await page.getByRole('button', { name: 'Revisit Your First File' }).click();
  await expect(page.getByRole('heading', { name: 'Your First File', exact: true })).toBeVisible();
  await expect(page.getByText('Practice complete. Nicely done.')).not.toBeVisible();
  await command(page, 'cd my-first-project');
  await command(page, 'touch README.md');
  await expect(page.getByText('Practice complete. Nicely done.')).toBeVisible();
  await page.getByRole('button', { name: 'Practice again' }).click();
  await expect(page.getByText('Practice complete. Nicely done.')).not.toBeVisible();
  await command(page, 'cd my-first-project');
  await command(page, 'cat README.md');
  await expect(page.locator('.terminal-body')).toContainText('No such file or directory');
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill('practice draft');
  await page.getByRole('link', { name: 'Community', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Your First File', exact: true })).toBeVisible();
  await expect(input).toHaveValue('practice draft');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('cat README.md');
  await input.press('ArrowDown');
  await expect(input).toHaveValue('practice draft');
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(savedBefore);
  await page.getByRole('button', { name: 'Return to your course' }).click();
  await expect(
    page.getByRole('heading', { name: 'Build Your Launchpad', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Mission practice' })).not.toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await command(page, 'ls /home/learner');
  await expect(page.locator('.terminal-body')).not.toContainText('practice-only');
  await page.getByRole('button', { name: 'Revisit Where Am I?' }).click();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Build Your Launchpad', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await page.getByRole('link', { name: 'Academy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re through the gate.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
