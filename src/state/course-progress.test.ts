import { describe, expect, it } from 'vitest';
import { shortCourses } from '../courses/short-courses';
import { courseKey, loadCourseProgress, saveCourseProgress } from './course-progress';

describe('separate course completion', () => {
  it('keeps courses separate, restores completion, and recovers corrupt data', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
    const git = shortCourses[0],
      ai = shortCourses[1];
    const saved = { version: 1 as const, current: 2, completed: ['inspect', 'stage'] };
    expect(saveCourseProgress(git, saved, storage)).toBe(true);
    expect(loadCourseProgress(git, storage)).toEqual(saved);
    expect(loadCourseProgress(ai, storage).completed).toEqual([]);
    for (const invalid of [
      'null',
      '{broken',
      JSON.stringify({ ...saved, current: 99 }),
      JSON.stringify({ ...saved, completed: ['invented'] }),
      JSON.stringify({ ...saved, completed: ['inspect', 'inspect'] }),
    ]) {
      values.set(courseKey(git.id), invalid);
      expect(loadCourseProgress(git, storage)).toEqual({ version: 1, current: 0, completed: [] });
    }
  });
  it('reports storage failures', () => {
    expect(saveCourseProgress(shortCourses[0], { version: 1, current: 0, completed: [] })).toBe(
      false,
    );
  });
});
