import { test, expect } from '@playwright/test';
import { resources } from '../src/community/resources';

test('community categories, search, favorites, refresh and contribution instructions', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'Community', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Good learning travels.' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(resources.length);
  await expect(page.getByText('Bookmarks stay on this device. Upvotes are shared.')).toBeVisible();
  await page
    .getByRole('group', { name: 'Resource category' })
    .getByRole('button', { name: 'Web', exact: true })
    .click();
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.getByRole('searchbox', { name: 'Search resources' }).fill('odin');
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Save The Odin Project', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Unsave The Odin Project', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.getByRole('button', { name: 'My favorites' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article').getByRole('heading')).toContainText('The Odin Project');
  await expect(page.getByRole('link', { name: 'Explore the repository' })).toHaveAttribute(
    'href',
    'https://github.com/TheOdinProject/curriculum',
  );
  await page.getByRole('button', { name: 'Unsave The Odin Project', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your shelf is waiting.' })).toBeVisible();
  await page.getByRole('button', { name: 'Browse all resources' }).click();
  await page.getByRole('link', { name: 'Know something worth sharing?' }).click();
  await page.getByText('How to suggest a resource', { exact: true }).click();
  await expect(page.locator('.resource-contribute')).toContainText('src/community/resources.ts');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test('navigation and completed-mission replay preserve the live workspace, draft, history and output', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill('pwd');
  await input.press('Enter');
  await page.getByRole('button', { name: 'Next mission' }).click();
  await expect(page.getByRole('heading', { name: 'What’s Here?' })).toBeVisible();
  await input.press('ArrowUp');
  await expect(input).toHaveValue('pwd');
  await input.fill('a draft');
  const saveBefore = await page.evaluate(() =>
    localStorage.getItem('kglab:terminal-fundamentals:v1'),
  );
  await page.getByRole('button', { name: 'Revisit Where Am I?' }).click();
  await expect(page.getByRole('region', { name: 'Mission practice' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Where Am I?', exact: true })).toBeVisible();
  await expect(input).toHaveValue('');
  await input.fill('pwd');
  await input.press('Enter');
  await expect(page.getByText('Practice complete. Nicely done.')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '14');
  await page.getByRole('button', { name: 'Watch walkthrough for Where Am I?' }).click();
  const demo = page.getByRole('dialog', { name: 'Where Am I?' });
  await expect(demo.getByRole('button', { name: 'Back to practice' })).toBeVisible();
  await demo.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Watch walkthrough for Where Am I?' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Return to your course' }).click();
  await expect(page.getByRole('heading', { name: 'What’s Here?', exact: true })).toBeVisible();
  await expect(input).toHaveValue('a draft');
  expect(await page.evaluate(() => localStorage.getItem('kglab:terminal-fundamentals:v1'))).toBe(
    saveBefore,
  );
  await page.getByRole('link', { name: 'Community', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Good learning travels.' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'What’s Here?' })).toBeVisible();
  await expect(input).toHaveValue('a draft');
  await expect(page.locator('.terminal-body')).toContainText('/home/learner');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('pwd');
  await input.fill('ls');
  await input.press('Enter');
  await page.getByRole('button', { name: 'Next mission' }).click();
  await input.press('ArrowUp');
  await expect(input).toHaveValue('ls');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('pwd');
  await page.getByRole('button', { name: 'Reset course progress' }).click();
  await page.getByRole('button', { name: 'Reset course', exact: true }).click();
  await input.press('ArrowUp');
  await expect(input).toHaveValue('');
});

test('blocked favorites storage reports session-only state and corrupt saves recover', async ({
  page,
}) => {
  await page.goto('/#community');
  await page.evaluate(() => localStorage.setItem('kglab:resource-favorites:v1', '{broken'));
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(resources.length);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('storage unavailable');
    };
  });
  await page.getByRole('button', { name: 'Save Pro Git', exact: true }).click();
  await expect(
    page.getByText(
      'Favorites are available for this visit only; your browser could not save them.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unsave Pro Git', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
