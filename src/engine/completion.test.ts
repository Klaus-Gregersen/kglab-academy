import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { completeCommand } from './completion';
import { createMachine, HOME } from './filesystem';

describe('terminal completion', () => {
  it('completes a command without executing it', () => {
    const machine = createMachine();
    const result = completeCommand(machine, 'pw');
    expect(result.line).toBe('pwd ');
    expect(result.cursor).toBe(4);
    expect(machine).toEqual(createMachine());
  });
  it('offers ambiguous commands rather than guessing', () => {
    const result = completeCommand(createMachine(), 'c');
    expect(result.line).toBe('c');
    expect(result.candidates.map((item) => item.label)).toEqual(['cd', 'cat', 'clear']);
    expect(completeCommand(createMachine(), '').candidates).toHaveLength(8);
  });
  it('completes directories with a slash and files with a space', () => {
    expect(completeCommand(createMachine(), 'cd pro').line).toBe('cd projects/');
    expect(completeCommand(createMachine(), 'cat wel').line).toBe('cat welcome.txt ');
  });
  it('uses the current workspace, not hardcoded lesson names', () => {
    let machine = execute(createMachine(), 'mkdir -p projects/app/src').machine;
    machine = execute(machine, 'touch projects/app/src/main.ts').machine;
    machine = execute(machine, 'cd projects/app').machine;
    expect(completeCommand(machine, 'cat sr').line).toBe('cat src/');
    expect(completeCommand(machine, 'cat src/ma').line).toBe('cat src/main.ts ');
    expect(completeCommand(machine, 'cd s').line).toBe('cd src/');
  });
  it.each([
    ['cd /ho', 'cd /home/'],
    ['cat ~/wel', 'cat ~/welcome.txt '],
    ['cd ~', 'cd ~/'],
    ['cd ..', 'cd ../'],
    ['ls ../lear', 'ls ../learner/'],
    ['cd .la', 'cd .lab/'],
  ])('handles absolute, home, parent and hidden paths: %s', (line, expected) => {
    expect(completeCommand(createMachine(), line).line).toBe(expected);
  });
  it('only suggests directories for cd and hides dotfiles by default', () => {
    const machine = createMachine();
    expect(completeCommand(machine, 'cd wel').candidates).toEqual([]);
    expect(completeCommand(machine, 'ls ').candidates.map((item) => item.label)).toEqual([
      'projects/',
      'welcome.txt',
    ]);
  });
  it('expands the common prefix and lets the learner choose among matches', () => {
    const machine = execute(createMachine(), 'mkdir alpha alpine').machine;
    const result = completeCommand(machine, 'cd a');
    expect(result.line).toBe('cd alp');
    expect(result.candidates.map((item) => item.line)).toEqual(['cd alpha/', 'cd alpine/']);
  });
  it.each(['cat my\\ f', 'cat "my f', "cat 'my f"])(
    'completes spaced names into executable arguments: %s',
    (line) => {
      const machine = execute(createMachine(), 'touch "my file.txt"').machine;
      const result = completeCommand(machine, line);
      expect(result.candidates).toHaveLength(1);
      expect(execute(machine, result.line).success).toBe(true);
      expect(execute(machine, result.line).paths).toEqual([`${HOME}/my file.txt`]);
    },
  );
  it('replaces the active token at the caret and preserves following arguments', () => {
    const result = completeCommand(createMachine(), 'cat welXXXXX welcome.txt', 7);
    expect(result.line).toBe('cat welcome.txt welcome.txt');
    expect(result.cursor).toBe('cat welcome.txt'.length);
    expect(execute(createMachine(), result.line).success).toBe(true);
  });
  it('does not invent paths, complete options, or interpret shell syntax', () => {
    for (const line of ['cat missing', 'cd nowhere/', 'pwd ', 'ls -', 'cat x | c']) {
      const result = completeCommand(createMachine(), line);
      expect(result.line).toBe(line);
      expect(result.candidates).toEqual([]);
    }
  });
  it('escapes special filename characters as literal data', () => {
    const machine = execute(createMachine(), "touch '$(example).txt'").machine;
    const result = completeCommand(machine, 'cat ');
    const selected = result.candidates.find((item) => item.label === '$(example).txt')!;
    expect(execute(machine, selected.line).success).toBe(true);
    expect(execute(machine, selected.line).paths).toEqual([`${HOME}/$(example).txt`]);
  });
});
