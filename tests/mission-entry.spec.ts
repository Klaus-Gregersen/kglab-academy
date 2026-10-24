import { test, expect, type Page } from '@playwright/test';

async function expectMissionEntry(page: Page, title: string) {
  await expect(page.getByRole('textbox', { name: 'Terminal command' })).toBeVisible();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeFocused();
  await expect(page.getByRole('region', { name: title, exact: true })).toContainText('Start here');
  await expect
    .poll(async () => {
      const box = await page.locator('#mission-brief').boundingBox();
      return box !== null && box.y >= 8 && box.y <= 125;
    })
    .toBe(true);
}

test('mission entry starts at the description, while practice keeps keyboard focus', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start your first mission' }).click();
  await expectMissionEntry(page, 'Where Am I?');
  await page
    .locator('#mission-brief')
    .screenshot({ path: test.info().outputPath('mission-brief.png') });

  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill('pwd');
  await input.press('Enter');
  await expect(input).toBeFocused();
  await expect(page.getByText('Mission complete. Nicely done.')).toBeVisible();
  await expect(input).toBeInViewport();

  await page.getByRole('button', { name: 'Next mission' }).click();
  await expectMissionEntry(page, 'What’s Here?');
  await input.fill('unfinished command');
  await page.reload();
  await expectMissionEntry(page, 'What’s Here?');

  await page.getByRole('link', { name: 'Community', exact: true }).click();
  await page.getByRole('link', { name: 'KG LAB Academy home', exact: true }).click();
  await page.getByRole('button', { name: 'Continue your mission', exact: true }).click();
  await expectMissionEntry(page, 'What’s Here?');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('reduced motion and a course reset also start at the mission description', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#workspace');
  await expectMissionEntry(page, 'Where Am I?');
  await page.getByRole('button', { name: 'Reset course progress' }).click();
  await page.getByRole('button', { name: 'Reset course', exact: true }).click();
  await expectMissionEntry(page, 'Where Am I?');
});
