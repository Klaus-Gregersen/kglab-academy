import { useEffect, useRef, useState } from 'react';
import { Lightbulb } from 'lucide-react';

export function HintLightbulb({ enabled, size }: { enabled: boolean; size: number }) {
  const element = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    if (!enabled || !element.current) return;
    // Don't spend the attention cue while the hint is below the fold.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [enabled]);
  return (
    <Lightbulb
      ref={element}
      size={size}
      className={enabled && visible ? 'hint-attention' : undefined}
      aria-hidden="true"
    />
  );
}
