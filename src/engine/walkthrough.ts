import type { Mission } from '../courses/terminal-fundamentals';
import { execute } from './commands';

export type DemoStep = {
  command: string;
  explanation: string;
  cwd: string;
  nextCwd: string;
  output: string;
  success: boolean;
};

// Use the same interpreter as practice, starting from a completely separate
// fixture. Demo execution never enters the progress, history, or storage paths.
export function buildWalkthrough(mission: Mission): DemoStep[] {
  let machine = mission.startingState();
  return mission.walkthrough.map((step) => {
    const cwd = machine.cwd;
    const result = execute(machine, step.command);
    machine = result.machine;
    return { ...step, cwd, nextCwd: machine.cwd, output: result.output, success: result.success };
  });
}

export type PlaybackFrame = {
  step: number;
  typed: number;
  phase: 'typing' | 'result' | 'finished';
};
export const firstFrame = (): PlaybackFrame => ({ step: 0, typed: 0, phase: 'typing' });
export function finalFrame(steps: DemoStep[]): PlaybackFrame {
  return { step: steps.length - 1, typed: steps.at(-1)!.command.length, phase: 'finished' };
}
export function nextFrame(frame: PlaybackFrame, steps: DemoStep[]): PlaybackFrame {
  if (frame.phase === 'finished') return frame;
  if (frame.phase === 'typing') {
    return frame.typed < steps[frame.step].command.length
      ? { ...frame, typed: frame.typed + 1 }
      : { ...frame, phase: 'result' };
  }
  return frame.step + 1 < steps.length
    ? { step: frame.step + 1, typed: 0, phase: 'typing' }
    : finalFrame(steps);
}
