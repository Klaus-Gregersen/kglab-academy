import { describe, expect, it } from 'vitest';
import { ACADEMY, academyCommands, createAcademyMachine, runAcademy } from './academy';
import { completeCommand } from './completion';

describe('read-only course directory', () => {
  it('uses normal paths and reading without launching a course on cd', () => {
    const initial = createAcademyMachine();
    const list = runAcademy(initial, 'ls');
    expect(list.listing).toBe(true);
    expect(list.output).toContain('git-fundamentals/  Available');
    const entered = runAcademy(initial, 'cd git-fundamentals');
    expect(entered.machine.cwd).toBe(`${ACADEMY}/git-fundamentals`);
    expect(entered.output).toBe('');
    expect(runAcademy(entered.machine, 'cat README.md').output).toContain(
      'four interactive introductory lessons',
    );
    const lessonDir = runAcademy(entered.machine, 'cd lessons');
    expect(runAcademy(lessonDir.machine, 'ls').output).toContain('01-inspect.md');
    expect(runAcademy(lessonDir.machine, 'cat 01-inspect.md').output).toContain('unstaged');
    expect(runAcademy(lessonDir.machine, 'cd ../..').machine.cwd).toBe(ACADEMY);
  });
  it('keeps planned courses honest and rejects mutation and shell operators', () => {
    const machine = createAcademyMachine();
    expect(runAcademy(machine, 'cat linux-fundamentals/README.md').output).toContain('Planned');
    for (const line of ['mkdir surprise', 'touch README.md', 'ls; pwd', 'git status', 'rm -rf /']) {
      const result = runAcademy(machine, line);
      expect(result.success).toBe(false);
      expect(result.machine).toBe(machine);
    }
    expect(completeCommand(machine, 'cd ai', 5, academyCommands).line).toBe('cd ai-fundamentals/');
    expect(
      completeCommand(machine, '', 0, academyCommands).candidates.map((item) => item.label),
    ).not.toContain('mkdir');
  });
});
