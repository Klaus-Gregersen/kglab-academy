import { parseCommand } from './parser';
import type { Completion } from './completion';

export type GitCommit = { id: string; parent: string | null; message: string; content: string };
export type GitRepo = {
  branch: string;
  branches: Record<string, string>;
  commits: GitCommit[];
  working: string;
  staged: string | null;
};
export const ORIGINAL_README = '# Learning lab\nBuild. Learn. Repeat.\n';
const edited = ORIGINAL_README + 'Welcome to the lab.\n';
export function createGitRepo(lesson: string): GitRepo {
  return {
    branch: 'main',
    branches: { main: 'a1b2c3d' },
    commits: [
      { id: 'a1b2c3d', parent: null, message: 'Create learning lab', content: ORIGINAL_README },
    ],
    working: lesson === 'branch' ? ORIGINAL_README : edited,
    staged: lesson === 'commit' ? edited : null,
  };
}
export function gitHead(repo: GitRepo): GitCommit {
  return repo.commits.find((commit) => commit.id === repo.branches[repo.branch])!;
}
function diff(before: string, after: string) {
  if (before === after) return '';
  const a = before.trimEnd().split('\n'),
    b = after.trimEnd().split('\n');
  return [
    '--- a/README.md',
    '+++ b/README.md',
    `@@ -1,${a.length} +1,${b.length} @@`,
    ...a.map((line) => '-' + line),
    ...b.map((line) => '+' + line),
  ].join('\n');
}
export function runGit(
  repo: GitRepo,
  line: string,
): { repo: GitRepo; output: string; success: boolean; clear?: boolean } {
  const fail = (output: string) => ({ repo, output, success: false });
  let words: string[];
  try {
    words = parseCommand(line);
  } catch (error) {
    return fail((error as Error).message);
  }
  if (words.length === 1 && words[0] === 'clear')
    return { repo, output: '', success: true, clear: true };
  if (words.length === 1 && words[0] === 'help')
    return {
      repo,
      success: true,
      output:
        'Simulated local Git repository: one tracked README.md.\ngit status · git diff · git diff --cached · git add README.md\ngit commit -m "message" · git log --oneline\ngit switch -c <branch> · git switch <branch> · git branch\nUse the file editor for changes. No remote, push, merge, or real Git process is available.',
    };
  if (words[0] !== 'git')
    return fail('Use git commands here, or type help. Edit README.md using the editor above.');
  const args = words.slice(1),
    head = gitHead(repo);
  const ok = (output: string, next = repo) => ({ repo: next, output, success: true });
  if (args.length === 1 && args[0] === 'status') {
    const staged = repo.staged !== null && repo.staged !== head.content;
    const dirty = repo.working !== (repo.staged ?? head.content);
    return ok(
      `On branch ${repo.branch}\n${staged ? '\nChanges to be committed:\n  modified: README.md\n' : ''}${dirty ? '\nChanges not staged for commit:\n  modified: README.md\n' : ''}${!staged && !dirty ? 'nothing to commit, working tree clean' : ''}`,
    );
  }
  if (args[0] === 'diff' && (args.length === 1 || (args.length === 2 && args[1] === '--cached')))
    return ok(
      args[1] === '--cached'
        ? diff(head.content, repo.staged ?? head.content)
        : diff(repo.staged ?? head.content, repo.working),
    );
  if (args.length === 2 && args[0] === 'add' && ['README.md', '.'].includes(args[1]))
    return ok('', { ...repo, staged: repo.working });
  if (args.length === 3 && args[0] === 'commit' && args[1] === '-m') {
    if (!args[2].trim() || args[2].length > 120)
      return fail('Use a non-empty commit message of at most 120 characters.');
    if (repo.staged === null || repo.staged === head.content)
      return fail(
        'Nothing staged to commit. Run git status, then git add README.md to select a change.',
      );
    const commit = {
      id: (0xc0ffee0 + repo.commits.length).toString(16),
      parent: head.id,
      message: args[2],
      content: repo.staged,
    };
    return ok(`[${repo.branch} ${commit.id}] ${commit.message}`, {
      ...repo,
      commits: [...repo.commits, commit],
      branches: { ...repo.branches, [repo.branch]: commit.id },
      staged: null,
    });
  }
  if (args.length === 2 && args[0] === 'log' && args[1] === '--oneline') {
    const lines: string[] = [];
    let commit: GitCommit | undefined = head;
    while (commit) {
      lines.push(`${commit.id} ${commit.message}`);
      const parent: string | null = commit.parent;
      commit = repo.commits.find((item) => item.id === parent);
    }
    return ok(lines.join('\n'));
  }
  if (args.length === 1 && args[0] === 'branch')
    return ok(
      Object.keys(repo.branches)
        .sort()
        .map((name) => `${name === repo.branch ? '*' : ' '} ${name}`)
        .join('\n'),
    );
  if (args[0] === 'switch' && (args.length === 2 || (args.length === 3 && args[1] === '-c'))) {
    const create = args[1] === '-c',
      branch = args[create ? 2 : 1];
    const exists = Object.hasOwn(repo.branches, branch);
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9_/-]{0,59}$/.test(branch) ||
      branch.includes('//') ||
      branch.endsWith('/')
    )
      return fail('Choose a simple branch name such as feature/welcome.');
    if (create && exists) return fail(`Branch ${branch} already exists. Use git switch ${branch}.`);
    if (!create && !exists)
      return fail(`Unknown branch ${branch}. Use git branch to list branches.`);
    if (
      !create &&
      branch !== repo.branch &&
      (repo.working !== head.content || (repo.staged !== null && repo.staged !== head.content))
    )
      return fail(
        'This introductory simulator asks you to commit your changes before switching branches. Real Git can keep compatible uncommitted changes across a switch.',
      );
    const branches = create ? { ...repo.branches, [branch]: head.id } : repo.branches;
    const content = repo.commits.find((commit) => commit.id === branches[branch])!.content;
    return ok(`Switched to ${create ? 'a new ' : ''}branch '${branch}'`, {
      ...repo,
      branches,
      branch,
      working: create || branch === repo.branch ? repo.working : content,
      staged: create || branch === repo.branch ? repo.staged : null,
    });
  }
  return fail(
    'That command is not supported in this introductory simulator. Type help for the available Git commands.',
  );
}
export function gitGoal(lesson: string, repo: GitRepo, line: string): boolean {
  const args = parseCommand(line);
  if (lesson === 'inspect') return args.join(' ') === 'git status';
  if (lesson === 'stage')
    return (
      args.join(' ') === 'git diff --cached' &&
      repo.staged !== null &&
      repo.staged !== gitHead(repo).content
    );
  if (lesson === 'commit') return args.join(' ') === 'git log --oneline' && repo.commits.length > 1;
  return (
    repo.branch === 'feature/welcome' &&
    repo.branches.main === 'a1b2c3d' &&
    repo.branches['feature/welcome'] !== 'a1b2c3d'
  );
}
const phrases = [
  'git status',
  'git diff',
  'git diff --cached',
  'git add README.md',
  'git commit -m ',
  'git log --oneline',
  'git branch',
  'git switch main',
  'git switch feature/welcome',
  'git switch -c feature/welcome',
  'help',
  'clear',
];
export function completeGit(line: string, caret: number): Completion {
  const matches = caret === line.length ? phrases.filter((phrase) => phrase.startsWith(line)) : [];
  let shared = matches[0] ?? line;
  for (const match of matches) while (!match.startsWith(shared)) shared = shared.slice(0, -1);
  return {
    line: shared,
    cursor: shared.length,
    candidates: matches.map((value) => ({ label: value, line: value, cursor: value.length })),
    message: matches.length
      ? `${matches.length} matching command${matches.length === 1 ? '' : 's'}. Press Enter when ready.`
      : 'No matching completions. Type help for commands, or move the caret to the end.',
  };
}
