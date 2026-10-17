import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, RotateCcw, TerminalSquare, X } from 'lucide-react';
import type { Mission } from '../courses/terminal-fundamentals';
import { displayPath } from '../engine/filesystem';
import { buildWalkthrough, finalFrame, firstFrame, nextFrame } from '../engine/walkthrough';

export function MissionWalkthrough({
  mission,
  reviewing = false,
  onClose,
  onTry,
}: {
  mission: Mission;
  reviewing?: boolean;
  onClose: () => void;
  onTry: () => void;
}) {
  const steps = useMemo(() => buildWalkthrough(mission), [mission]);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [frame, setFrame] = useState(() => (reducedMotion ? finalFrame(steps) : firstFrame()));
  const [playing, setPlaying] = useState(!reducedMotion);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [transcriptOpen, setTranscriptOpen] = useState(reducedMotion);
  const dialog = useRef<HTMLDialogElement>(null);
  const playButton = useRef<HTMLButtonElement>(null);
  const tryButton = useRef<HTMLButtonElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const finished = frame.phase === 'finished';
  const current = steps[frame.step];

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    (playButton.current ?? tryButton.current)?.focus({ preventScroll: true });
    return () => {
      element.close();
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    function changedMotion() {
      setReducedMotion(media.matches);
      if (media.matches) {
        setPlaying(false);
        setFrame(finalFrame(steps));
        setTranscriptOpen(true);
      }
    }
    const visibility = () => setPageVisible(!document.hidden);
    media.addEventListener('change', changedMotion);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      media.removeEventListener('change', changedMotion);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [steps]);

  useEffect(() => {
    if (!playing || finished || reducedMotion || !pageVisible) return;
    const delay =
      frame.phase === 'result' ? 2100 : frame.typed === current.command.length ? 550 : 65;
    const timer = setTimeout(() => {
      const next = nextFrame(frame, steps);
      setFrame(next);
      if (next.phase === 'finished') setPlaying(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [playing, finished, reducedMotion, pageVisible, frame, current, steps]);

  useEffect(() => {
    if (screen.current) screen.current.scrollTop = screen.current.scrollHeight;
  }, [frame]);

  function replay() {
    setTranscriptOpen(false);
    setFrame(firstFrame());
    setPlaying(true);
  }

  return (
    <dialog
      ref={dialog}
      className="walkthrough-dialog"
      aria-labelledby="walkthrough-title"
      aria-describedby="walkthrough-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          onClose();
      }}
    >
      <button
        type="button"
        className="walkthrough-close"
        onClick={onClose}
        aria-label="Close walkthrough"
      >
        <X size={19} />
      </button>
      <div className="eyebrow">
        {reviewing ? 'REVISIT · A SEPARATE EXAMPLE' : 'WATCH FIRST · THEN TRY IT YOURSELF'}
      </div>
      <h2 id="walkthrough-title">{mission.title}</h2>
      <p className="demo-concept">
        <code>{mission.command}</code>
        <span>{mission.meaning}</span>
      </p>
      <p id="walkthrough-description">{mission.explanation}</p>
      <div className="demo-terminal" aria-label="Walkthrough example">
        <div className="demo-titlebar">
          <span>
            <TerminalSquare size={15} />
            Demo terminal
          </span>
          <span>Separate practice example</span>
        </div>
        <div className="demo-screen" ref={screen} aria-hidden="true">
          {steps.slice(0, finished ? steps.length : frame.step + 1).map((step, index) => {
            const typing = index === frame.step && frame.phase === 'typing';
            const hasResult = finished || index < frame.step || frame.phase === 'result';
            return (
              <div className="demo-entry" key={index}>
                <div className="demo-command">
                  <span className="green">learner</span>
                  <span className="demo-path">{displayPath(step.cwd)}</span>
                  <span>$</span>
                  <code>
                    {typing ? step.command.slice(0, frame.typed) : step.command}
                    {typing && <span className="demo-caret">▌</span>}
                  </code>
                  {(!typing || frame.typed === step.command.length) && <kbd>Enter ↵</kbd>}
                </div>
                {hasResult && step.output && <pre>{step.output}</pre>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="demo-narration">
        <span className="demo-step" role="status">
          {finished ? 'Example complete' : `Step ${frame.step + 1} of ${steps.length}`}
        </span>
        <p>
          {frame.phase === 'typing'
            ? `Type ${current.command}, then press Enter.`
            : current.explanation}
        </p>
      </div>
      <div className="demo-controls">
        {!reducedMotion && (
          <>
            <button
              ref={playButton}
              type="button"
              className="button-secondary"
              disabled={finished}
              onClick={() => setPlaying((value) => !value)}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {finished ? 'Finished' : playing ? 'Pause' : 'Resume'}
            </button>
            <button type="button" className="demo-replay" onClick={replay}>
              <RotateCcw size={14} />
              Replay
            </button>
          </>
        )}
        {reducedMotion && (
          <p className="demo-motion-note">Reduced motion: showing the full example.</p>
        )}
        <span className="demo-unchanged">
          Watching keeps your workspace and progress as they are.
        </span>
      </div>
      <details
        className="demo-transcript"
        open={transcriptOpen}
        onToggle={(event) => {
          const open = event.currentTarget.open;
          setTranscriptOpen(open);
          if (open) {
            setPlaying(false);
            setFrame(finalFrame(steps));
          }
        }}
      >
        <summary>Read all steps instead</summary>
        <ol>
          {steps.map((step, index) => (
            <li key={index}>
              <p>
                In <code>{step.cwd}</code>, type <code>{step.command}</code> and press Enter.
              </p>
              {step.output ? (
                <pre>{step.output}</pre>
              ) : (
                <p className="demo-silent">This command succeeds without printing a message.</p>
              )}
              <p>{step.explanation}</p>
            </li>
          ))}
        </ol>
      </details>
      <div className="demo-footer">
        <span>Watch as often as you like.</span>
        <button ref={tryButton} type="button" className="button-primary" onClick={onTry}>
          {reviewing ? 'Back to practice' : 'Try it myself'}
          <ArrowRight size={16} />
        </button>
      </div>
    </dialog>
  );
}
