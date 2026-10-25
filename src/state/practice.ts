import { missions } from '../courses/terminal-fundamentals';
import type { CommandResult } from '../engine/commands';
import type { Machine } from '../engine/filesystem';

export type Practice = {
  missionIndex: number;
  machine: Machine;
  complete: boolean;
};

// Practice is session-only and always starts from the selected mission's fixture.
export function freshPractice(missionIndex: number): Practice {
  if (!Number.isInteger(missionIndex) || !missions[missionIndex])
    throw new RangeError('Unknown practice mission');
  return { missionIndex, machine: missions[missionIndex].startingState(), complete: false };
}

export function applyPracticeResult(practice: Practice, result: CommandResult): Practice {
  return {
    ...practice,
    machine: result.machine,
    complete: practice.complete || missions[practice.missionIndex].validate(result),
  };
}
