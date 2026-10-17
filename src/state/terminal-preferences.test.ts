import { describe, expect, it } from 'vitest';
import {
  defaultPreferences,
  loadPreferences,
  savePreferences,
  PREFERENCES_KEY,
} from './terminal-preferences';
import type { StorageLike } from './progress';

function storageWith(raw: string | null = null): StorageLike {
  let saved = raw;
  return {
    getItem: () => saved,
    setItem: (_, value) => {
      saved = value;
    },
    removeItem: () => {
      saved = null;
    },
  };
}

describe('terminal preferences', () => {
  it('defaults to gentle guidance with a 45-second delay', () => {
    expect(loadPreferences()).toEqual(defaultPreferences());
    expect(loadPreferences(storageWith())).toMatchObject({
      hints: true,
      nudges: true,
      animateHints: true,
      nudgeDelay: 45,
    });
  });
  it('persists each toggle and a longer delay independently of course state', () => {
    const storage = storageWith();
    const chosen = {
      hints: false,
      nudges: false,
      animateHints: false,
      shortcutGuide: false,
      nudgeDelay: 120 as const,
    };
    expect(savePreferences(chosen, storage)).toBe(true);
    expect(loadPreferences(storage)).toEqual(chosen);
    expect(JSON.parse(storage.getItem(PREFERENCES_KEY)!)).toMatchObject({ version: 1 });
  });
  it.each([
    'null',
    '{broken',
    JSON.stringify({ ...defaultPreferences(), version: 2 }),
    JSON.stringify({ ...defaultPreferences(), version: 1, hints: 'false' }),
    JSON.stringify({ ...defaultPreferences(), version: 1, nudgeDelay: 0 }),
  ])('ignores malformed or incompatible preferences', (raw) => {
    expect(loadPreferences(storageWith(raw))).toEqual(defaultPreferences());
  });
  it('handles blocked or unavailable browser storage', () => {
    const blocked: StorageLike = {
      getItem() {
        throw Error('blocked');
      },
      setItem() {
        throw Error('quota');
      },
      removeItem() {},
    };
    expect(loadPreferences(blocked)).toEqual(defaultPreferences());
    expect(savePreferences(defaultPreferences(), blocked)).toBe(false);
    expect(savePreferences(defaultPreferences())).toBe(false);
  });
});
