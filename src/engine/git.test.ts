import { describe, expect, it } from 'vitest';
import { createGitRepo, gitGoal, gitHead, ORIGINAL_README, runGit } from './git';

describe('local Git teaching model', () => {
  it('stages a snapshot and commits that snapshot, preserving later working edits', () => {
    const initial = createGitRepo('stage');
    const staged = runGit(initial, 'git add README.md').repo;
    const changed = { ...staged, working: 'An edit after staging\n' };
    const committed = runGit(changed, 'git commit -m "Save staged content"');
    expect(committed.success).toBe(true);
    expect(gitHead(committed.repo).content).toBe(initial.working);
    expect(committed.repo.working).toBe(changed.working);
    expect(runGit(committed.repo, 'git status').output).toContain('Changes not staged');
    expect(gitHead(initial).content).toBe(ORIGINAL_README);
  });
  it('creates a branch at HEAD, moves only that branch, and restores branch snapshots', () => {
    let repo = runGit(createGitRepo('branch'), 'git switch -c feature/welcome').repo;
    repo = { ...repo, working: 'Welcome on a feature branch\n' };
    repo = runGit(repo, 'git add README.md').repo;
    repo = runGit(repo, 'git commit -m "Add welcome"').repo;
    expect(gitGoal('branch', repo, 'git status')).toBe(true);
    expect(repo.branches.main).toBe('a1b2c3d');
    expect(gitHead(repo).parent).toBe('a1b2c3d');
    const main = runGit(repo, 'git switch main').repo;
    expect(main.working).toBe(ORIGINAL_README);
    expect(runGit(main, 'git log --oneline').output).not.toContain('Add welcome');
    expect(runGit(main, 'git switch feature/welcome').repo.working).toBe(repo.working);
  });
  it('reports invalid input without changing a repository', () => {
    const repo = createGitRepo('branch');
    for (const line of [
      'git switch constructor',
      'git switch unknown',
      'git commit -m "Nothing"',
      'git push',
      'git status; ls',
    ]) {
      const result = runGit(repo, line);
      expect(result.success).toBe(false);
      expect(result.repo).toBe(repo);
    }
    expect(runGit({ ...repo, working: 'unsaved' }, 'git switch -c feature/test').success).toBe(
      true,
    );
  });
});
