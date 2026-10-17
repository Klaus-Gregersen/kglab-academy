import { describe, expect, it } from 'vitest';
import { missions } from '../courses/terminal-fundamentals';
import { execute } from './commands';
import { HOME } from './filesystem';
import { buildWalkthrough, finalFrame, firstFrame, nextFrame } from './walkthrough';

describe('mission walkthroughs', () => {
  it.each(missions)('$title demonstrates a complete, successful solution', (mission) => {
    const steps = buildWalkthrough(mission);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((step) => step.success && step.explanation.length > 20)).toBe(true);
    let machine = mission.startingState();
    let result = execute(machine, 'help');
    for (const step of steps) {
      result = execute(machine, step.command);
      machine = result.machine;
    }
    expect(mission.validate(result)).toBe(true);
  });
  it('shows directory changes and confirmation output, including silent creation commands', () => {
    const navigation = buildWalkthrough(missions[2]);
    expect(navigation[0].output).toBe(HOME);
    expect(navigation[2].output).toBe('');
    expect(navigation[2].nextCwd).toBe(`${HOME}/projects`);
    expect(navigation.at(-1)!.output).toBe(`${HOME}/projects`);
    expect(buildWalkthrough(missions[3]).at(-1)!.output).toContain('my-first-project/');
    expect(buildWalkthrough(missions[4]).at(-1)!.output).toContain('README.md');
    expect(buildWalkthrough(missions[5]).at(-1)!.output).toContain('Build. Learn. Repeat.');
  });
  it('rebuilding a demonstration leaves independent starting fixtures unchanged', () => {
    const before = missions[4].startingState();
    buildWalkthrough(missions[4]);
    buildWalkthrough(missions[4]);
    expect(missions[4].startingState()).toEqual(before);
    expect(before.nodes[`${HOME}/projects/my-first-project/README.md`]).toBeUndefined();
  });
  it('types each command before showing results and reaches a stable final frame', () => {
    const steps = buildWalkthrough(missions[2]);
    let frame = firstFrame();
    const results: number[] = [];
    for (let i = 0; i < 300 && frame.phase !== 'finished'; i++) {
      const next = nextFrame(frame, steps);
      if (next.phase === 'result') {
        expect(next.typed).toBe(steps[next.step].command.length);
        results.push(next.step);
      }
      frame = next;
    }
    expect(results).toEqual([0, 1, 2, 3]);
    expect(frame).toEqual(finalFrame(steps));
    expect(nextFrame(frame, steps)).toBe(frame);
  });
});
