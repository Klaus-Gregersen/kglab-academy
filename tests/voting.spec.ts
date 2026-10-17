import { test, expect } from '@playwright/test';
import { resources } from '../src/community/resources';

test('two independent browsers share real counts, retain votes, deduplicate retries, and undo independently', async ({
  page,
  browser,
}, testInfo) => {
  const id = testInfo.project.name === 'desktop' ? 'pro-git' : 'missing-semester';
  const title = resources.find((resource) => resource.id === id)!.title;
  const card = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: `${title} (opens in a new tab)`, exact: true }),
  });
  await page.goto('/#community');
  await expect(card.getByRole('button', { name: `Upvote ${title}`, exact: true })).toBeEnabled();
  const baseline = Number(await card.locator('.resource-upvote strong').textContent());
  await card.getByRole('button', { name: `Upvote ${title}`, exact: true }).click();
  await expect(
    card.getByRole('button', { name: `Remove upvote for ${title}`, exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(card.locator('.resource-upvote strong')).toHaveText(String(baseline + 1));
  await page.reload();
  await expect(
    card.getByRole('button', { name: `Remove upvote for ${title}`, exact: true }),
  ).toBeEnabled();
  const origin = new URL(page.url()).origin;
  const duplicate = await page.request.put(`${origin}/api/community/votes/${id}`, {
    headers: { Origin: origin, 'X-KGLAB-Vote': '1' },
    data: { voted: true },
  });
  expect((await duplicate.json()).votes[id].count).toBe(baseline + 1);
  const otherContext = await browser.newContext();
  try {
    const other = await otherContext.newPage();
    await other.goto(page.url());
    const second = other.getByRole('article').filter({
      has: other.getByRole('heading', { name: `${title} (opens in a new tab)`, exact: true }),
    });
    await expect(
      second.getByRole('button', { name: `Upvote ${title}`, exact: true }),
    ).toBeEnabled();
    await expect(second.locator('.resource-upvote strong')).toHaveText(String(baseline + 1));
    await second.getByRole('button', { name: `Upvote ${title}`, exact: true }).click();
    await expect(second.locator('.resource-upvote strong')).toHaveText(String(baseline + 2));
    await page.reload();
    await expect(card.locator('.resource-upvote strong')).toHaveText(String(baseline + 2));
    await card.getByRole('button', { name: `Remove upvote for ${title}`, exact: true }).click();
    await expect(card.locator('.resource-upvote strong')).toHaveText(String(baseline + 1));
    await other.reload();
    await expect(
      second.getByRole('button', { name: `Remove upvote for ${title}`, exact: true }),
    ).toBeEnabled();
    await second.getByRole('button', { name: `Remove upvote for ${title}`, exact: true }).click();
    await expect(second.locator('.resource-upvote strong')).toHaveText(String(baseline));
  } finally {
    await otherContext.close();
  }
});

test('upvoting changes the default ranking while search, category, bookmarks and alphabetical sorting still work', async ({
  page,
}) => {
  const scores = Object.fromEntries(resources.map(({ id }) => [id, { count: 0, voted: false }]));
  scores['mdn-learn'].count = 2;
  scores['odin-project'].count = 2;
  await page.route('**/api/community/votes**', async (route) => {
    if (route.request().method() === 'PUT') {
      const id = route.request().url().split('/').at(-1)!;
      const voted = route.request().postDataJSON().voted;
      scores[id].count += voted ? 1 : -1;
      scores[id].voted = voted;
    }
    await route.fulfill({ json: { votes: scores } });
  });
  await page.goto('/#community');
  await expect(page.getByRole('combobox', { name: 'Sort resources' })).toHaveValue('votes');
  await expect(page.getByRole('article').first()).toContainText('Learn web development');
  await page.getByRole('button', { name: 'Upvote The Odin Project', exact: true }).click();
  await expect(page.getByRole('article').first()).toContainText('The Odin Project');
  await expect(page.getByRole('article').first().locator('.resource-upvote strong')).toHaveText(
    '3',
  );
  await page
    .getByRole('group', { name: 'Resource category' })
    .getByRole('button', { name: 'Web', exact: true })
    .click();
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Sort resources' }).selectOption('title');
  await expect(page.getByRole('article').first()).toContainText('Learn web development');
  await page.getByRole('searchbox', { name: 'Search resources' }).fill('odin');
  await page.getByRole('button', { name: 'Save The Odin Project', exact: true }).click();
  await page.getByRole('button', { name: 'My favorites' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('unavailable voting never invents counts or a successful vote and can recover', async ({
  page,
}) => {
  const scores = Object.fromEntries(resources.map(({ id }) => [id, { count: 0, voted: false }]));
  let failRead = true;
  await page.route('**/api/community/votes**', async (route) => {
    if (failRead || route.request().method() === 'PUT')
      await route.fulfill({ status: 503, json: { error: 'Your vote could not be saved.' } });
    else await route.fulfill({ json: { votes: scores } });
  });
  await page.goto('/#community');
  await expect(
    page.getByText('Community votes couldn’t be loaded.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upvote Pro Git', exact: true })).toBeDisabled();
  await expect(page.getByRole('article').first().locator('.resource-upvote strong')).toHaveText(
    '—',
  );
  await page.getByRole('button', { name: 'Save Pro Git', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unsave Pro Git', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  failRead = false;
  await page.getByRole('button', { name: 'Refresh votes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Upvote Pro Git', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Upvote Pro Git', exact: true }).click();
  await expect(page.getByText('Your vote could not be saved.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upvote Pro Git', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.getByRole('button', { name: 'Refresh votes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Upvote Pro Git', exact: true })).toBeEnabled();
});
