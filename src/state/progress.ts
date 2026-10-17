import { missions } from '../courses/terminal-fundamentals';
import type { CommandResult } from '../engine/commands';
import type { Machine } from '../engine/filesystem';

export const STORAGE_KEY = 'kglab:terminal-fundamentals:v1';
export type Progress = {
  version: 1;
  started: boolean;
  current: number;
  completed: string[];
  machine: Machine;
};
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export const freshProgress = (): Progress => ({
  version: 1,
  started: false,
  current: 0,
  completed: [],
  machine: missions[0].startingState(),
});

export function applyResult(progress: Progress, result: CommandResult): Progress {
  const mission = missions[progress.current];
  const complete = mission.validate(result);
  return {
    ...progress,
    machine: result.machine,
    completed:
      complete && !progress.completed.includes(mission.id)
        ? [...progress.completed, mission.id]
        : progress.completed,
  };
}
export function advance(progress: Progress): Progress {
  if (
    !progress.completed.includes(missions[progress.current].id) ||
    progress.current === missions.length - 1
  )
    return progress;
  const current = progress.current + 1;
  return { ...progress, current, machine: missions[current].prepare(progress.machine) };
}

function validMachine(value: unknown): value is Machine {
  if (!value || typeof value !== 'object') return false;
  const m = value as Machine;
  if (
    typeof m.cwd !== 'string' ||
    typeof m.previous !== 'string' ||
    !m.nodes ||
    typeof m.nodes !== 'object' ||
    Array.isArray(m.nodes)
  )
    return false;
  const entries = Object.entries(m.nodes);
  if (!entries.length || entries.length > 1000 || m.nodes['/']?.kind !== 'directory') return false;
  for (const [path, node] of entries) {
    if (
      !path.startsWith('/') ||
      path.length > 1024 ||
      /[\x00-\x1f\x7f]/.test(path) ||
      (path !== '/' && path.endsWith('/')) ||
      path.split('/').some((p) => p === '.' || p === '..')
    )
      return false;
    if (
      !node ||
      (node.kind !== 'directory' &&
        (node.kind !== 'file' || typeof node.content !== 'string' || node.content.length > 10000))
    )
      return false;
    if (path !== '/' && m.nodes[path.slice(0, path.lastIndexOf('/')) || '/']?.kind !== 'directory')
      return false;
  }
  return m.nodes[m.cwd]?.kind === 'directory' && m.nodes[m.previous]?.kind === 'directory';
}
export function loadProgress(storage?: StorageLike): Progress {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw || raw.length > 500000) return freshProgress();
    const value = JSON.parse(raw) as Progress;
    if (
      value.version !== 1 ||
      typeof value.started !== 'boolean' ||
      !Number.isInteger(value.current) ||
      value.current < 0 ||
      value.current >= missions.length ||
      !Array.isArray(value.completed) ||
      !validMachine(value.machine)
    )
      return freshProgress();
    // Completion is always a contiguous prefix; a corrupted save cannot unlock later missions.
    if (
      value.completed.length > missions.length ||
      value.completed.some((id, i) => id !== missions[i].id) ||
      value.completed.length < value.current ||
      value.completed.length > value.current + 1
    )
      return freshProgress();
    return value;
  } catch {
    return freshProgress();
  }
}
export function saveProgress(progress: Progress, storage?: StorageLike): boolean {
  try {
    if (!storage) return false;
    const raw = JSON.stringify(progress);
    if (raw.length > 500000) return false;
    storage.setItem(STORAGE_KEY, raw);
    return true;
  } catch {
    return false;
  }
}
export function browserStorage(): StorageLike | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
