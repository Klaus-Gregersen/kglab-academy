import { describe, expect, it } from 'vitest';
import { filterResources } from './resources';
import { FAVORITES_KEY, loadFavorites, saveFavorites } from './favorites';
import type { StorageLike } from '../state/progress';

function storage(): StorageLike {
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

describe('community shelf', () => {
  it('combines category, search and personal favorites without mixing categories', () => {
    expect(
      filterResources('Web', '  odIN  ', ['odin-project'], true).map((item) => item.id),
    ).toEqual(['odin-project']);
    expect(filterResources('Git', 'odin', ['odin-project'], true)).toEqual([]);
    expect(filterResources('All', '', [], true)).toEqual([]);
  });
  it('retains known favorites, removes duplicates and ignores stale IDs', () => {
    const saved = storage();
    saved.setItem(
      FAVORITES_KEY,
      JSON.stringify({ version: 1, ids: ['pro-git', 'pro-git', 'removed-resource', 4] }),
    );
    expect(loadFavorites(saved)).toEqual(['pro-git']);
    expect(saveFavorites(['mdn-learn'], saved)).toBe(true);
    expect(loadFavorites(saved)).toEqual(['mdn-learn']);
  });
  it.each(['{broken', 'null', '{}', '{"version":2,"ids":["pro-git"]}', '{"version":1,"ids":null}'])(
    'recovers from invalid favorites: %s',
    (raw) => {
      const saved = storage();
      saved.setItem(FAVORITES_KEY, raw);
      expect(loadFavorites(saved)).toEqual([]);
    },
  );
  it('handles blocked storage without preventing learning', () => {
    const blocked = {
      getItem() {
        throw Error('blocked');
      },
      setItem() {
        throw Error('quota');
      },
      removeItem() {},
    };
    expect(loadFavorites(blocked)).toEqual([]);
    expect(saveFavorites(['pro-git'], blocked)).toBe(false);
    expect(saveFavorites(['pro-git'])).toBe(false);
  });
});
