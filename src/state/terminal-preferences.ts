import type { StorageLike } from './progress';

export const PREFERENCES_KEY = 'kglab:terminal-preferences:v1';
export type TerminalPreferences = {
  hints: boolean;
  nudges: boolean;
  animateHints: boolean;
  shortcutGuide: boolean;
  nudgeDelay: 45 | 90 | 120;
};
export const defaultPreferences = (): TerminalPreferences => ({
  hints: true,
  nudges: true,
  animateHints: true,
  shortcutGuide: true,
  nudgeDelay: 45,
});

export function loadPreferences(storage?: StorageLike): TerminalPreferences {
  try {
    const raw = storage?.getItem(PREFERENCES_KEY);
    if (!raw || raw.length > 2000) return defaultPreferences();
    const value = JSON.parse(raw);
    if (
      !value ||
      value.version !== 1 ||
      !['hints', 'nudges', 'animateHints', 'shortcutGuide'].every(
        (key) => typeof value[key] === 'boolean',
      ) ||
      ![45, 90, 120].includes(value.nudgeDelay)
    )
      return defaultPreferences();
    return {
      hints: value.hints,
      nudges: value.nudges,
      animateHints: value.animateHints,
      shortcutGuide: value.shortcutGuide,
      nudgeDelay: value.nudgeDelay,
    };
  } catch {
    return defaultPreferences();
  }
}

export function savePreferences(value: TerminalPreferences, storage?: StorageLike): boolean {
  try {
    if (!storage) return false;
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ ...value, version: 1 }));
    return true;
  } catch {
    return false;
  }
}
