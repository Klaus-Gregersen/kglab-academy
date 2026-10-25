import { test, expect } from '@playwright/test';
import { unlockAcademy, shell, openCourse } from './course-helpers';

test('terminal navigation teaches directories, handles mistakes, and keeps planned courses closed', async ({
  page,
}) => {
  await page.goto('/#course/git-fundamentals');
  await expect(
    page.getByRole('heading', { name: 'A little practice opens the gate.' }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Git command' })).not.toBeVisible();
  await unlockAcademy(page);
  await expect(page.getByRole('table', { name: 'Course directory' })).not.toBeVisible();
  const input = page.getByRole('textbox', { name: 'Academy command' });
  await input.fill('no-match');
  await input.press('Tab');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('no-match');
  await input.press('Escape');
  await input.press('Tab');
  await expect(page.getByRole('button', { name: 'Run academy command' })).toBeFocused();
  await shell(page, 'ls');
  await expect(page.getByRole('table', { name: 'Course directory' }).getByRole('row')).toHaveCount(
    10,
  );
  await expect(page.locator('.course-state.planned')).toHaveCount(6);
  await page.screenshot({ path: test.info().outputPath('academy-terminal.png'), fullPage: true });
  await page.getByRole('button', { name: 'linux-fundamentals/', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Selected course' })).toContainText('Planned');
  await expect(page.getByRole('button', { name: 'Start Linux Fundamentals' })).not.toBeVisible();
  await shell(page, 'cat README.md');
  await expect(page.getByRole('log', { name: 'Course terminal output' })).toContainText(
    'lessons are not available yet',
  );
  await shell(page, 'cd ..');
  await input.fill('cd git-f');
  await input.press('Tab');
  await expect(input).toHaveValue('cd git-fundamentals/');
  await input.press('Enter');
  await expect(page.getByRole('textbox', { name: 'Git command' })).not.toBeVisible();
  await shell(page, 'ls');
  await expect(page.getByRole('log', { name: 'Course terminal output' })).toContainText('lessons/');
  await shell(page, 'cat README.md');
  await shell(page, 'cd lessons');
  await shell(page, 'pwd');
  await expect(page.getByRole('log', { name: 'Course terminal output' })).toContainText(
    '/home/learner/academy/git-fundamentals/lessons',
  );
  await shell(page, 'cd ..');
  await page.getByRole('button', { name: 'Start Git Fundamentals', exact: true }).click();
  await expect(page).toHaveURL(/#course\/git-fundamentals$/);
  await page.getByRole('button', { name: 'Back to Academy terminal', exact: false }).click();
  await expect(page.locator('.academy-terminal .terminal-titlebar')).toContainText(
    '~/academy/git-fundamentals',
  );
  await input.press('ArrowUp');
  await expect(input).toHaveValue('cd ..');
  await input.press('Control+l');
  await expect(page.getByRole('log', { name: 'Course terminal output' })).toHaveText('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Git lessons exercise real snapshot and branch concepts and persist independent completion', async ({
  page,
}) => {
  const intro = await unlockAcademy(page);
  await openCourse(page, 'git-fundamentals', 'Git Fundamentals');
  await shell(page, 'git status', 'Git command');
  await expect(page.getByText('Lesson complete. Nicely done.')).toBeVisible();
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await shell(page, 'git add README.md', 'Git command');
  await shell(page, 'git diff --cached', 'Git command');
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await shell(page, 'git commit -m "Welcome learners"', 'Git command');
  await shell(page, 'git log --oneline', 'Git command');
  await expect(page.getByRole('log', { name: 'Git output' })).toContainText(
    'c0ffee1 Welcome learners',
  );
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await shell(page, 'git switch -c feature/welcome', 'Git command');
  await page
    .getByRole('textbox', { name: 'Edit README.md' })
    .fill('# Feature branch\nWelcome learners.\n');
  await shell(page, 'git add README.md', 'Git command');
  await shell(page, 'git commit -m "Welcome on feature branch"', 'Git command');
  await expect(
    page.getByRole('progressbar', { name: 'Git Fundamentals completion' }),
  ).toHaveAttribute('aria-valuenow', '100');
  await shell(page, 'git switch main', 'Git command');
  await expect(page.getByRole('textbox', { name: 'Edit README.md' })).toHaveValue(
    '# Learning lab\nBuild. Learn. Repeat.\n',
  );
  await page.screenshot({ path: test.info().outputPath('git-course.png'), fullPage: true });
  await page.reload();
  await expect(
    page.getByRole('progressbar', { name: 'Git Fundamentals completion' }),
  ).toHaveAttribute('aria-valuenow', '100');
  await expect(page.getByText('Completed earlier. Ready to practise again.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('kglab:terminal-fundamentals:v1'))).toBe(
    intro,
  );
  await page.getByRole('button', { name: 'Back to Academy terminal', exact: false }).click();
  await openCourse(page, 'ai-fundamentals', 'AI Fundamentals');
  await page.getByRole('link', { name: 'Skip to content', exact: true }).focus();
  await page.getByRole('link', { name: 'Skip to content', exact: true }).press('Enter');
  await expect(page).toHaveURL(/#course\/ai-fundamentals$/);
  await expect(
    page.getByRole('heading', { name: 'Model, application, or agent?', exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole('progressbar', { name: 'AI Fundamentals completion' }),
  ).toHaveAttribute('aria-valuenow', '0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('AI activities teach roles, grounded prompts, bounded tools and hosting without live model calls', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:5174/')) external.push(request.url());
  });
  const intro = await unlockAcademy(page);
  await openCourse(page, 'ai-fundamentals', 'AI Fundamentals');
  await page.getByLabel('Generates text from the supplied input').selectOption('agent');
  await page
    .getByLabel('A chat screen that manages conversation messages')
    .selectOption('application');
  await page
    .getByLabel('A program lets a model choose tools, observes results, and continues')
    .selectOption('agent');
  await page.getByRole('button', { name: 'Check my matches' }).click();
  await expect(page.getByRole('button', { name: 'Next lesson' })).not.toBeVisible();
  await page.getByLabel('Generates text from the supplied input').selectOption('model');
  await page.getByRole('button', { name: 'Check my matches' }).click();
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await page
    .getByLabel('Goal: write an instruction for the next engineer’s handover')
    .fill('Summarise the incident for the next engineer using the evidence below.');
  await page.getByLabel('Relevant context').selectOption('incident');
  await page.getByLabel('Evidence boundary').selectOption('guess');
  await page.getByLabel('Output format').selectOption('bullets');
  await page
    .getByRole('checkbox', {
      name: 'I checked that my goal can be answered from the supplied evidence.',
    })
    .check();
  await page.getByRole('button', { name: 'Build my prompt' }).click();
  await expect(page.getByRole('button', { name: 'Next lesson' })).not.toBeVisible();
  await page.getByLabel('Evidence boundary').selectOption('evidence');
  await page.getByRole('button', { name: 'Build my prompt' }).click();
  await expect(page.getByText('Your assembled prompt · Not a model response')).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('ai-course.png'), fullPage: true });
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await page.getByRole('checkbox', { name: 'Allow read_logs', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Allow restart_service', exact: true }).check();
  await page.getByRole('button', { name: 'Run the next demo step' }).click();
  await expect(page.getByText('Prepared tool result', { exact: true })).not.toBeVisible();
  await page.getByRole('checkbox', { name: 'Allow restart_service', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Run the next demo step' }).click();
  await page.getByLabel('Choose the next action').selectOption('claim');
  await page.getByRole('button', { name: 'Choose the next step' }).click();
  await expect(page.getByRole('button', { name: 'Next lesson' })).not.toBeVisible();
  await page.getByLabel('Choose the next action').selectOption('report');
  await page.getByRole('button', { name: 'Choose the next step' }).click();
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await page.getByLabel('Offline laptop;', { exact: false }).selectOption('local');
  await page.getByLabel('Organisation already operates', { exact: false }).selectOption('onprem');
  await page.getByLabel('Online prototype;', { exact: false }).selectOption('cloud');
  await page.getByRole('button', { name: 'Check architecture choices' }).click();
  await expect(
    page.getByRole('progressbar', { name: 'AI Fundamentals completion' }),
  ).toHaveAttribute('aria-valuenow', '100');
  await page.reload();
  await expect(
    page.getByRole('progressbar', { name: 'AI Fundamentals completion' }),
  ).toHaveAttribute('aria-valuenow', '100');
  expect(await page.evaluate(() => localStorage.getItem('kglab:terminal-fundamentals:v1'))).toBe(
    intro,
  );
  expect(external).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
