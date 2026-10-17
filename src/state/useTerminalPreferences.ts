import { useEffect, useState } from 'react';
import { browserStorage } from './progress';
import { loadPreferences, savePreferences, type TerminalPreferences } from './terminal-preferences';

export function useTerminalPreferences() {
  const [preferences, setPreferences] = useState(() => loadPreferences(browserStorage()));
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    setSaved(savePreferences(preferences, browserStorage()));
  }, [preferences]);
  function changePreferences(patch: Partial<TerminalPreferences>) {
    setPreferences((current) => ({ ...current, ...patch }));
  }
  return { preferences, changePreferences, preferencesSaved: saved };
}
