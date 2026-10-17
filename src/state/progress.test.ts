import { describe, expect, it } from 'vitest';
import { missions, LAUNCHPAD } from '../courses/terminal-fundamentals';
import { execute } from '../engine/commands';
import { HOME } from '../engine/filesystem';
import {
  advance,
  applyResult,
  freshProgress,
  loadProgress,
  saveProgress,
  STORAGE_KEY,
  type StorageLike,
} from './progress';

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}
describe('mission progression', () => {
  it('completes the entire course, retains the workspace, and persists after every step', () => {
    const storage = memoryStorage();
    let progress = { ...freshProgress(), started: true };
    for (const [index, mission] of missions.entries()) {
      expect(progress.current).toBe(index);
      for (const line of mission.solution)
        progress = applyResult(progress, execute(progress.machine, line));
      expect(progress.completed).toHaveLength(index + 1);
      expect(saveProgress(progress, storage)).toBe(true);
      expect(loadProgress(storage)).toEqual(progress);
      progress = advance(progress);
    }
    expect(progress.completed).toHaveLength(missions.length);
    expect(progress.machine.nodes[`${HOME}/projects/my-first-project/README.md`]?.kind).toBe(
      'file',
    );
  });
  it('keeps the current and previous directories through transitions, even after exploring', () => {
    let progress = freshProgress();
    progress = applyResult(progress, execute(progress.machine, 'pwd'));
    progress = applyResult(progress, execute(progress.machine, 'cd projects'));
    const before = progress.machine;
    progress = advance(progress);
    expect(progress.machine).toEqual(before);
    for (const mission of missions.filter((item) => item.id !== 'read-a-file')) {
      expect(mission.prepare(before)).toBe(before);
    }
    const original = missions[5].startingState();
    original.nodes[`${HOME}/projects/my-first-project/notes.txt`] = {
      kind: 'file',
      content: 'My own note',
    };
    const reading = missions[5].prepare(original);
    expect(reading.nodes).toEqual(original.nodes);
    expect(reading.cwd).toBe(missions[5].startingState().cwd);
    expect(reading.previous).toBe(missions[5].startingState().previous);
  });
  it('requires the final project, its README, and a successful location check together', () => {
    const mission = missions.at(-1)!;
    let result = execute(mission.startingState(), 'pwd');
    expect(mission.validate(result)).toBe(false);
    for (const line of [`mkdir -p ${LAUNCHPAD}`, `cd ${LAUNCHPAD}`, 'pwd']) {
      result = execute(result.machine, line);
      expect(mission.validate(result)).toBe(false);
    }
    result = execute(result.machine, 'touch README.md');
    expect(mission.validate(result)).toBe(false);
    expect(mission.validate(execute(result.machine, 'pwd extra'))).toBe(false);
    expect(mission.validate(execute(result.machine, 'pwd'))).toBe(true);
  });
  it('retains completed six-mission saves and unlocks the appended challenge', () => {
    const storage = memoryStorage();
    const legacy = {
      ...freshProgress(),
      started: true,
      current: 5,
      completed: missions.slice(0, 6).map((mission) => mission.id),
      machine: missions[5].startingState(),
    };
    saveProgress(legacy, storage);
    const restored = loadProgress(storage);
    expect(restored).toEqual(legacy);
    expect(advance(restored).current).toBe(6);
    expect(advance(restored).machine.cwd).toBe(legacy.machine.cwd);
    expect(advance(restored).completed).toHaveLength(6);
  });
  it('does not unlock on a mistake, failed command, or viewing help', () => {
    const progress = freshProgress();
    for (const line of ['help', 'ls', 'pwdd', 'pwd extra']) {
      const next = applyResult(progress, execute(progress.machine, line));
      expect(next.completed).toEqual([]);
      expect(advance(next).current).toBe(0);
    }
  });
  it('validates filesystem results rather than exact command strings', () => {
    const mkdirMission = missions[3];
    const result = execute(
      mkdirMission.startingState(),
      `mkdir -p ${HOME}/projects/my-first-project`,
    );
    expect(mkdirMission.validate(result)).toBe(true);
    const fileMission = missions[4];
    expect(
      fileMission.validate(
        execute(fileMission.startingState(), 'touch ./my-first-project/README.md'),
      ),
    ).toBe(true);
    expect(fileMission.validate(execute(fileMission.startingState(), 'touch README.md'))).toBe(
      false,
    );
    expect(
      missions[5].validate(
        execute(missions[5].startingState(), `cat ${HOME}/projects/my-first-project/notes.txt`),
      ),
    ).toBe(true);
  });
  it('only completes once and supports relative navigation alternatives', () => {
    let progress = freshProgress();
    progress = applyResult(progress, execute(progress.machine, 'pwd'));
    expect(applyResult(progress, execute(progress.machine, 'pwd')).completed).toHaveLength(1);
    expect(missions[2].validate(execute(missions[2].startingState(), `cd ${HOME}/projects`))).toBe(
      true,
    );
  });
  it('provides a usable independent starting state for every mission', () => {
    for (const mission of missions) {
      let result = execute(mission.startingState(), 'help');
      for (const line of mission.solution) result = execute(result.machine, line);
      expect(mission.validate(result)).toBe(true);
    }
  });
});
describe('local persistence', () => {
  it('preserves the previous save if a workspace exceeds the size limit', () => {
    const storage = memoryStorage();
    saveProgress(freshProgress(), storage);
    const oversized = freshProgress();
    oversized.machine.nodes[`${HOME}/huge.txt`] = { kind: 'file', content: 'a'.repeat(500000) };
    expect(saveProgress(oversized, storage)).toBe(false);
    expect(loadProgress(storage)).toEqual(freshProgress());
  });
  it('round-trips an unfinished mission and custom files', () => {
    const storage = memoryStorage();
    const progress = applyResult(
      freshProgress(),
      execute(freshProgress().machine, 'mkdir experiments'),
    );
    saveProgress(progress, storage);
    expect(loadProgress(storage)).toEqual(progress);
  });
  it('gracefully handles unavailable storage', () => {
    const blocked = {
      getItem() {
        throw Error('blocked');
      },
      setItem() {
        throw Error('quota');
      },
      removeItem() {},
    };
    expect(loadProgress(blocked)).toEqual(freshProgress());
    expect(saveProgress(freshProgress(), blocked)).toBe(false);
    expect(loadProgress()).toEqual(freshProgress());
    expect(saveProgress(freshProgress())).toBe(false);
  });
  it.each([
    '{broken',
    'null',
    JSON.stringify({ ...freshProgress(), version: 9 }),
    JSON.stringify({ ...freshProgress(), current: 4 }),
    JSON.stringify({ ...freshProgress(), completed: [missions[3].id] }),
    JSON.stringify({ ...freshProgress(), machine: { cwd: '/', previous: '/', nodes: {} } }),
  ])('recovers from corrupted or incompatible saves', (raw) => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, raw);
    expect(loadProgress(storage)).toEqual(freshProgress());
  });
});
