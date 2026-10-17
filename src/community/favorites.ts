import type { StorageLike } from '../state/progress';
import { resources } from './resources';

export const FAVORITES_KEY = 'kglab:resource-favorites:v1';
const knownIds = new Set(resources.map((resource) => resource.id));

export function loadFavorites(storage?: StorageLike): string[] {
  try {
    const raw = storage?.getItem(FAVORITES_KEY);
    if (!raw || raw.length > 10000) return [];
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || !Array.isArray(saved.ids)) return [];
    return [
      ...new Set<string>(
        saved.ids.filter((id: unknown) => typeof id === 'string' && knownIds.has(id)),
      ),
    ];
  } catch {
    return [];
  }
}

export function saveFavorites(ids: string[], storage?: StorageLike): boolean {
  try {
    if (!storage) return false;
    storage.setItem(
      FAVORITES_KEY,
      JSON.stringify({ version: 1, ids: ids.filter((id) => knownIds.has(id)) }),
    );
    return true;
  } catch {
    return false;
  }
}
