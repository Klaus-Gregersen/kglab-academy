import { test, expect, type Page } from '@playwright/test';

async function command(page: Page, text: string) {
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill(text);
  await input.press('Enter');
}

test('playground, all seven missions, refresh, completion, and reset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Build.');
  await command(page, 'cd projects');
  await expect(page.getByLabel('Simulated terminal').locator('.terminal-titlebar')).toContainText(
    '~/projects',
  );
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  await expect(page.getByRole('heading', { name: 'Where Am I?' })).toBeVisible();
  await expect(
    page.getByLabel('Simulated terminal').locator('.terminal-titlebar'),
  ).not.toContainText('~/projects');
  await command(page, 'nonsense');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', { name: 'Need a nudge?' }).click();
  await expect(
    page.getByText('The path it prints is your location', { exact: false }),
  ).toBeVisible();
  await command(page, 'pwd');
  await expect(page.getByText('Mission complete. Nicely done.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Mission complete. Nicely done.')).toBeVisible();
  await page.getByRole('button', { name: 'Next mission' }).click();
  await command(page, 'ls');
  await page.getByRole('button', { name: 'Next mission' }).click();
  await command(page, 'cd /home/learner/projects');
  await page.getByRole('button', { name: 'Next mission' }).click();
  await command(page, 'mkdir -p ./my-first-project');
  await page.getByRole('button', { name: 'Next mission' }).click();
  await expect(page.getByLabel('Simulated terminal').locator('.terminal-titlebar')).toContainText(
    '~/projects',
  );
  await command(page, 'cd my-first-project');
  await command(page, 'touch README.md');
  await page.reload();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '71');
  await page.getByRole('button', { name: 'Next mission' }).click();
  await command(page, 'cat notes.txt');
  await page.getByRole('button', { name: 'Next mission' }).click();
  await expect(page.getByRole('heading', { name: 'Build Your Launchpad' })).toBeVisible();
  await page
    .locator('#mission-brief')
    .screenshot({ path: test.info().outputPath('final-mission-brief.png') });
  await command(page, 'cd ~/projects');
  await command(page, 'mkdir launchpad');
  await command(page, 'cd launchpad');
  await command(page, 'touch README.md');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '86');
  await command(page, 'pwd');
  await expect(page.getByText('Your first terminal, conquered.')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await page.getByRole('button', { name: 'Unlock your academy' }).click();
  await expect(page).toHaveURL(/#academy$/);
  await expect(page.getByRole('heading', { name: 'You’re through the gate.' })).toBeFocused();
  await expect(page.getByRole('region', { name: 'Academy course terminal' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Course directory' })).not.toBeVisible();
  const academyInput = page.getByRole('textbox', { name: 'Academy command' });
  await academyInput.fill('ls');
  await academyInput.press('Enter');
  await expect(page.getByRole('table', { name: 'Course directory' }).getByRole('row')).toHaveCount(
    10,
  );
  await expect(page.locator('.course-state.planned')).toHaveCount(6);
  await page.screenshot({ path: test.info().outputPath('academy-unlocked.png'), fullPage: true });
  await expect(page.getByRole('link', { name: 'Community shelf' })).toHaveAttribute(
    'href',
    '#community',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.reload();
  await expect(page.getByRole('heading', { name: 'You’re through the gate.' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'You’re through the gate.' })).toBeVisible();
  await page.getByRole('button', { name: 'Revisit your terminal' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await page.getByRole('button', { name: 'Reset course progress' }).click();
  await expect(page.getByRole('button', { name: 'Keep learning' })).toBeFocused();
  await page.getByRole('button', { name: 'Keep learning' }).press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset course progress' })).toBeFocused();
  await page.getByRole('button', { name: 'Reset course progress' }).click();
  await page.getByRole('button', { name: 'Keep learning' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await page.getByRole('button', { name: 'Reset course progress' }).click();
  await page.getByRole('button', { name: 'Reset course', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByRole('heading', { name: 'Where Am I?' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await page.goto('/#academy');
  await expect(
    page.getByRole('heading', { name: 'A little practice opens the gate.' }),
  ).toBeVisible();
  await expect(page.locator('.academy-course-card')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the academy requires all intro missions, including when opened directly', async ({
  page,
}) => {
  await page.goto('/#academy');
  await expect(
    page.getByRole('heading', { name: 'A little practice opens the gate.' }),
  ).toBeVisible();
  await expect(page.getByText('0 / 7 missions complete')).toBeVisible();
  await expect(page.locator('.academy-course-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start the intro' }).click();
  await command(page, 'pwd');
  await page.getByRole('link', { name: 'Academy', exact: true }).click();
  await expect(page.getByText('1 / 7 missions complete')).toBeVisible();
  await expect(page.locator('.academy-course-card')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Continue the intro' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '14');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('keyboard history, save recovery, and responsive layout', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kglab:terminal-fundamentals:v1', '{broken'));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start your first mission' })).toBeVisible();
  await command(page, 'help');
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill('draft');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('help');
  await input.press('ArrowDown');
  await expect(input).toHaveValue('draft');
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  await command(page, 'mkdir "my experiments"');
  await page.reload();
  const nodes = await page.evaluate(
    () => JSON.parse(localStorage.getItem('kglab:terminal-fundamentals:v1')!).machine.nodes,
  );
  expect(nodes['/home/learner/my experiments'].kind).toBe('directory');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('visible command entry, Tab completion, and keyboard exit', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Type your command here')).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await page.locator('.terminal-body').click({ position: { x: 20, y: 150 } });
  await expect(input).toBeFocused();
  for (const unmatched of ['not-a-command', 'cat missing']) {
    await input.fill(unmatched);
    await input.press('Tab');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue(unmatched);
    await expect(page.locator('.completion-notice')).toContainText('No matching completions');
    await input.press('Tab');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue(unmatched);
  }
  await input.fill('');
  await input.press('Tab');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');
  await expect(
    page.getByRole('group', { name: 'Completion suggestions' }).getByRole('button'),
  ).toHaveCount(8);
  await input.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Complete command or path' })).toBeFocused();
  await page.getByRole('button', { name: 'Complete command or path' }).press('Tab');
  await expect(input).toBeFocused();
  await input.fill('c');
  await input.press('Tab');
  await expect(page.getByRole('group', { name: 'Completion suggestions' })).toBeVisible();
  await page.getByRole('button', { name: 'cd', exact: true }).click();
  await expect(input).toHaveValue('cd ');
  await input.fill('cd pro');
  await input.press('Tab');
  await expect(input).toHaveValue('cd projects/');
  await expect(
    page.getByLabel('Simulated terminal').locator('.terminal-titlebar'),
  ).not.toContainText('~/projects');
  await expect(page.getByText('You just used Tab completion.')).toBeVisible();
  await input.press('Escape');
  await input.press('Tab');
  await expect(page.getByRole('button', { name: 'Run command' })).toBeFocused();
  await page.getByRole('button', { name: 'Run command' }).press('Shift+Tab');
  await expect(input).toBeFocused();
  await input.press('Enter');
  await expect(page.getByLabel('Simulated terminal').locator('.terminal-titlebar')).toContainText(
    '~/projects',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('touch completion, live filesystem names, coaching, and mission validation', async ({
  page,
}) => {
  await page.goto('/');
  await command(page, 'mkdir "my experiments"');
  await expect(page.getByText('Spaces in a name?', { exact: true })).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill('cd "my ex');
  await page.getByRole('button', { name: 'Complete command or path' }).click();
  await expect(input).toHaveValue('cd "my experiments/"');
  await input.press('Enter');
  await expect(page.getByLabel('Simulated terminal').locator('.terminal-titlebar')).toContainText(
    '~/my experiments',
  );
  await expect(page.getByText('A couple of handy shortcuts.')).toBeVisible();
  await page.getByRole('button', { name: 'Show terminal tips', exact: true }).click();
  await page.getByRole('button', { name: 'Show another terminal tip' }).click();
  await expect(page.getByRole('complementary', { name: 'Terminal know-how' })).toBeVisible();
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  await input.fill('pw');
  await input.press('Tab');
  await expect(input).toHaveValue('pwd ');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await input.press('Enter');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '14');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
