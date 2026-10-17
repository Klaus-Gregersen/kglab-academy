import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { createMachine, HOME, resolvePath } from './filesystem';
import { parseCommand } from './parser';

describe('command tokenizer', () => {
  it('accepts whitespace, quoted arguments, and escaped spaces', () => {
    expect(parseCommand('  mkdir "my project" \'another folder\' one\\ two ')).toEqual([
      'mkdir',
      'my project',
      'another folder',
      'one two',
    ]);
    expect(parseCommand('touch ""')).toEqual(['touch', '']);
    expect(parseCommand('')).toEqual([]);
  });
  it('rejects unfinished quotes and escapes', () => {
    expect(() => parseCommand('cat "hello')).toThrow('Unclosed quote');
    expect(() => parseCommand('cat hello\\')).toThrow('backslash');
  });
  it.each(['pwd;ls', 'cat x | ls', 'touch x > y', 'cat $(pwd)', 'cat `pwd`', 'pwd && ls'])(
    'does not interpret shell syntax: %s',
    (line) => {
      expect(() => parseCommand(line)).toThrow();
    },
  );
  it('keeps shell characters literal inside quotes', () => {
    expect(parseCommand("touch '$(pwd)'")).toEqual(['touch', '$(pwd)']);
  });
  it('limits command size', () => expect(() => parseCommand('a'.repeat(2049))).toThrow('too long'));
});

describe('virtual filesystem and commands', () => {
  it('resolves absolute, relative, home, dot and parent paths', () => {
    expect(resolvePath(HOME, 'projects/../welcome.txt')).toBe(`${HOME}/welcome.txt`);
    expect(resolvePath(HOME, '/../../')).toBe('/');
    expect(resolvePath('/', '~/projects')).toBe(`${HOME}/projects`);
    expect(resolvePath(HOME, './projects//')).toBe(`${HOME}/projects`);
  });
  it('maintains current and previous directory without mutating the input', () => {
    const initial = createMachine();
    const changed = execute(initial, 'cd projects');
    expect(changed.success).toBe(true);
    expect(initial.cwd).toBe(HOME);
    expect(changed.machine.cwd).toBe(`${HOME}/projects`);
    expect(execute(changed.machine, 'pwd').output).toBe(`${HOME}/projects`);
    expect(execute(changed.machine, 'cd -').machine.cwd).toBe(HOME);
    expect(execute(changed.machine, 'cd ..').machine.cwd).toBe(HOME);
    expect(execute(changed.machine, 'cd').machine.cwd).toBe(HOME);
  });
  it('lists files and directories, including hidden files only on request', () => {
    const machine = createMachine();
    expect(execute(machine, 'ls').output).toContain('projects/');
    expect(execute(machine, 'ls').output).not.toContain('.lab');
    expect(execute(machine, 'ls -a').output).toContain('.lab/');
    expect(execute(machine, 'ls welcome.txt').output).toBe('welcome.txt');
    expect(execute(machine, 'ls projects').output).toBe('');
  });
  it('creates nested directories and files with different valid paths', () => {
    let machine = execute(createMachine(), 'mkdir -p projects/one/two').machine;
    machine = execute(machine, 'touch projects/one/two/README.md "my file.txt"').machine;
    expect(machine.nodes[`${HOME}/projects/one/two`]?.kind).toBe('directory');
    expect(machine.nodes[`${HOME}/projects/one/two/README.md`]).toEqual({
      kind: 'file',
      content: '',
    });
    expect(machine.nodes[`${HOME}/my file.txt`]?.kind).toBe('file');
  });
  it('reads content and touch preserves existing contents', () => {
    const original = createMachine();
    const result = execute(original, 'touch welcome.txt');
    expect(execute(result.machine, 'cat welcome.txt').output).toContain('Build. Learn. Repeat.');
    expect(
      execute(original, 'cat welcome.txt welcome.txt').output.match(/Build\. Learn\. Repeat\./g),
    ).toHaveLength(2);
  });
  it.each([
    'cd missing',
    'cd welcome.txt',
    'cat missing',
    'cat projects',
    'mkdir',
    'touch',
    'cat',
    'cd a b',
    'mkdir projects',
    'mkdir missing/child',
    'ls -z',
    'pwd extra',
    'help extra',
    'unknown',
    'touch ""',
    'touch "a\u001bb"',
  ])('reports errors and preserves the filesystem: %s', (line) => {
    const original = createMachine();
    const result = execute(original, line);
    expect(result.success).toBe(false);
    expect(result.output.length).toBeGreaterThan(0);
    expect(result.machine).toEqual(original);
  });
  it('rejects files as parent directories and rolls back partial operations', () => {
    const original = createMachine();
    expect(execute(original, 'touch okay missing/file').machine).toEqual(original);
    expect(execute(original, 'mkdir -p welcome.txt/sub').success).toBe(false);
    expect(execute(original, 'touch welcome.txt/sub').success).toBe(false);
  });
  it('supports safe clear and help commands', () => {
    expect(execute(createMachine(), 'clear').clear).toBe(true);
    expect(execute(createMachine(), 'help').output).toContain('browser simulation');
  });
});
