export type VNode = { kind: 'directory' } | { kind: 'file'; content: string };
export type Machine = { cwd: string; previous: string; nodes: Record<string, VNode> };
export const HOME = '/home/learner';
export const directory = (): VNode => ({ kind: 'directory' });

export function createMachine(): Machine {
  return {
    cwd: HOME,
    previous: HOME,
    nodes: {
      '/': directory(),
      '/home': directory(),
      [HOME]: directory(),
      [`${HOME}/projects`]: directory(),
      [`${HOME}/.lab`]: directory(),
      [`${HOME}/welcome.txt`]: {
        kind: 'file',
        content:
          'Welcome to KG LAB Academy.\nA terminal is a conversation with your computer.\nBuild. Learn. Repeat.\n',
      },
    },
  };
}

export function resolvePath(cwd: string, input: string): string {
  const expanded = input === '~' ? HOME : input.startsWith('~/') ? HOME + input.slice(1) : input;
  const parts = (expanded.startsWith('/') ? expanded : `${cwd}/${expanded}`).split('/');
  const result: string[] = [];
  for (const part of parts) {
    if (part === '..') result.pop();
    else if (part && part !== '.') result.push(part);
  }
  return '/' + result.join('/');
}

export function parentPath(path: string): string {
  return path.slice(0, path.lastIndexOf('/')) || '/';
}

export function children(machine: Machine, path: string, hidden = false): string[] {
  return Object.keys(machine.nodes)
    .filter(
      (key) =>
        key !== path &&
        parentPath(key) === path &&
        (hidden || !key.split('/').at(-1)!.startsWith('.')),
    )
    .sort((a, b) => a.localeCompare(b));
}

export function displayPath(path: string): string {
  return path === HOME ? '~' : path.startsWith(HOME + '/') ? '~' + path.slice(HOME.length) : path;
}
