import { describe, expect, it } from 'vitest';
import { missions } from '../courses/terminal-fundamentals';
import { execute } from '../engine/commands';
import { applyPracticeResult, freshPractice } from './practice';

describe('independent mission practice', () => {
  missions.forEach((mission, index) => {
    it(`can solve ${mission.title} from a fresh practice fixture`, () => {
      let practice = freshPractice(index);
      expect(practice.complete).toBe(false);
      practice = applyPracticeResult(practice, execute(practice.machine, 'not-a-command'));
      expect(practice.complete).toBe(false);
      for (const line of mission.solution)
        practice = applyPracticeResult(practice, execute(practice.machine, line));
      expect(practice.complete).toBe(true);
      // Repeating a completed exercise starts with fresh files and an unmet objective.
      expect(freshPractice(index)).toEqual({
        missionIndex: index,
        machine: mission.startingState(),
        complete: false,
      });
    });
  });
  it('rejects invalid mission indices', () => {
    for (const index of [-1, 0.5, missions.length, NaN])
      expect(() => freshPractice(index)).toThrow(RangeError);
  });
});
