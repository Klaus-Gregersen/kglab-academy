import type { Page } from '@playwright/test';
import { missions } from '../src/courses/terminal-fundamentals';
import { execute } from '../src/engine/commands';
import { advance, applyResult, freshProgress, STORAGE_KEY } from '../src/state/progress';

export async function unlockAcademy(page: Page) {
  let graduate = { ...freshProgress(), started: true };
  for (const mission of missions) {
    for (const line of mission.solution)
      graduate = applyResult(graduate, execute(graduate.machine, line));
    graduate = advance(graduate);
  }
  await page.goto('/#academy');
  await page.evaluate(({ key, saved }) => localStorage.setItem(key, JSON.stringify(saved)), {
    key: STORAGE_KEY,
    saved: graduate,
  });
  await page.reload();
  return page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
}
export async function shell(page: Page, line: string, label = 'Academy command') {
  const input = page.getByRole('textbox', { name: label, exact: true });
  await input.fill(line);
  await input.press('Enter');
}
export async function openCourse(page: Page, id: string, title: string) {
  await shell(page, `cd ~/academy/${id}`);
  await page.getByRole('button', { name: `Start ${title}`, exact: true }).click();
}
