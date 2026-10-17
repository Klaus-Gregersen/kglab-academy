import { useEffect, useRef, useState } from 'react';
import { Settings, X } from 'lucide-react';
import type { TerminalPreferences } from '../state/terminal-preferences';

export type PreferenceProps = {
  preferences: TerminalPreferences;
  onPreferencesChange: (patch: Partial<TerminalPreferences>) => void;
  preferencesSaved: boolean;
};

export function TerminalSettings({
  preferences,
  onPreferencesChange,
  preferencesSaved,
  id,
}: PreferenceProps & { id: string }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstToggle = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    firstToggle.current?.focus({ preventScroll: true });
    function outside(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  const toggles = [
    ['hints', 'Learning hints', 'Mission hints and practical terminal tips.'],
    ['nudges', 'Stuck nudges', 'Offer help after a quiet moment.'],
    ['animateHints', 'Hint animation', 'A brief wiggle; respects reduced motion.'],
    ['shortcutGuide', 'Shortcut guide', 'Keyboard reminders below the input.'],
  ] as const;

  return (
    <div
      className="terminal-settings"
      ref={wrapper}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="settings-trigger"
        aria-label="Terminal settings"
        aria-expanded={open}
        aria-controls={`${id}-settings`}
        onClick={() => setOpen((current) => !current)}
      >
        <Settings size={16} />
      </button>
      {open && (
        <section
          className="settings-panel"
          id={`${id}-settings`}
          role="region"
          aria-label="Terminal settings"
        >
          <div className="settings-heading">
            <h3>Make the lab yours.</h3>
            <button type="button" onClick={close} aria-label="Close terminal settings">
              <X size={16} />
            </button>
          </div>
          <p className="settings-intro">Choose how much guidance you’d like.</p>
          {toggles.map(([key, label, description], index) => (
            <label className="settings-row" key={key}>
              <span>
                <strong>{label}</strong>
                <small id={`${id}-${key}-description`}>{description}</small>
              </span>
              <input
                ref={index === 0 ? firstToggle : undefined}
                type="checkbox"
                role="switch"
                aria-label={label}
                aria-describedby={`${id}-${key}-description`}
                checked={preferences[key]}
                onChange={(event) => onPreferencesChange({ [key]: event.target.checked })}
              />
            </label>
          ))}
          <label className="settings-delay">
            Offer help after
            <select
              aria-label="Nudge delay"
              value={preferences.nudgeDelay}
              disabled={!preferences.hints || !preferences.nudges}
              onChange={(event) =>
                onPreferencesChange({
                  nudgeDelay: Number(event.target.value) as TerminalPreferences['nudgeDelay'],
                })
              }
            >
              <option value={45}>45 seconds</option>
              <option value={90}>90 seconds</option>
              <option value={120}>2 minutes</option>
            </select>
          </label>
          <p className="settings-note">
            Nudges need learning hints enabled. No countdown, no time limit.
          </p>
          <p className="settings-save-note" role="status">
            {preferencesSaved
              ? 'Preferences saved on this device.'
              : 'Available for this session. Browser storage could not save these preferences.'}
          </p>
        </section>
      )}
    </div>
  );
}
