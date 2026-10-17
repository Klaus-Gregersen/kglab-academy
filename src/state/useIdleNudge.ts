import { useEffect, useRef, useState, type RefObject } from 'react';

export function useIdleNudge({
  enabled,
  session,
  delay,
  scope,
}: {
  enabled: boolean;
  session: string;
  delay: number;
  scope: RefObject<HTMLElement | null>;
}) {
  const [nudged, setNudged] = useState(false);
  const fired = useRef(false);
  const previousSession = useRef(session);

  useEffect(() => {
    if (previousSession.current !== session) {
      previousSession.current = session;
      fired.current = false;
    }
    setNudged(false);
    const element = scope.current;
    if (!enabled || !element) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function pause() {
      clearTimeout(timer);
      setNudged(false);
    }
    function arm(event?: Event) {
      // Keep the offer mounted while its button is being clicked or focused.
      if (event?.target instanceof Element && event.target.closest('[data-nudge]')) return;
      pause();
      if (fired.current || document.hidden || !document.hasFocus()) return;
      timer = setTimeout(() => {
        if (!document.hidden && document.hasFocus()) {
          fired.current = true;
          setNudged(true);
        }
      }, delay);
    }
    // Reading is welcome: this is a single offer of help, never a countdown.
    // Interaction dismisses it; after firing it won't nag again in this mission.
    const events = ['keydown', 'pointerdown', 'input', 'focusin'] as const;
    events.forEach((event) => element.addEventListener(event, arm));
    document.addEventListener('visibilitychange', arm);
    window.addEventListener('blur', pause);
    window.addEventListener('focus', arm);
    arm();
    return () => {
      clearTimeout(timer);
      events.forEach((event) => element.removeEventListener(event, arm));
      document.removeEventListener('visibilitychange', arm);
      window.removeEventListener('blur', pause);
      window.removeEventListener('focus', arm);
    };
  }, [enabled, session, delay, scope]);

  return nudged;
}
