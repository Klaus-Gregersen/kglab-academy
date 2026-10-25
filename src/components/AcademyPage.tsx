import { ArrowRight, LockKeyhole, TerminalSquare } from 'lucide-react';
import { AcademyTerminal } from './AcademyTerminal';
import type { AcademySession } from '../engine/academy';

type Props = {
  completed: number;
  total: number;
  started: boolean;
  saved: boolean;
  onTerminal: () => void;
  session: AcademySession;
  onOpen: (id: string) => void;
};

export function AcademyPage({
  completed,
  total,
  started,
  saved,
  onTerminal,
  session,
  onOpen,
}: Props) {
  const unlocked = completed === total;
  if (unlocked)
    return (
      <main id="academy" className="academy-hub academy-terminal-page page-width">
        <div className="academy-terminal-heading">
          <div>
            <div className="eyebrow">YOUR ACADEMY · INTRO COMPLETE</div>
            <h1 id="academy-title" tabIndex={-1}>
              You’re through the gate<span className="green">.</span>
            </h1>
          </div>
          <button className="text-link" onClick={onTerminal}>
            Revisit your terminal →
          </button>
        </div>
        <AcademyTerminal session={session} onOpen={onOpen} />
        <p className="academy-save-note">
          {saved
            ? 'Intro completed · Progress stays in this browser'
            : 'Session only · Browser storage is unavailable'}
        </p>
      </main>
    );
  return (
    <main id="academy" className="academy-hub page-width">
      <section className="academy-welcome" aria-labelledby="academy-title">
        <div>
          <div className="eyebrow">YOUR FIRST STEP INTO THE ACADEMY</div>
          <h1 id="academy-title" tabIndex={-1}>
            A little practice opens the gate
            <span className="green">.</span>
          </h1>
          <p className="academy-lead">
            Complete Terminal Fundamentals to unlock your course hub. Seven small missions. A
            foundation you can build on.
          </p>
          <p>Free to learn. No account needed. One step at a time.</p>
        </div>
        <div className="academy-gate" aria-label="Academy locked">
          <LockKeyhole size={35} aria-hidden="true" />
          <span>INTRO IN PROGRESS</span>
          <div className="academy-gate-steps" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <i key={i} className={i < completed ? 'done' : ''} />
            ))}
          </div>
          <small>
            {completed} / {total} missions complete
          </small>
        </div>
      </section>

      <section className="academy-foundation" aria-labelledby="foundation-title">
        <span className="academy-foundation-icon">
          <TerminalSquare size={25} aria-hidden="true" />
        </span>
        <div>
          <span className="eyebrow">YOUR FOUNDATION</span>
          <h2 id="foundation-title">Terminal Fundamentals</h2>
          <p>Learn your way around a terminal before heading further into the lab.</p>
        </div>
        <button className="button-primary" onClick={onTerminal}>
          {started ? 'Continue the intro' : 'Start the intro'}
          <ArrowRight size={16} />
        </button>
      </section>

      <section className="academy-locked" aria-labelledby="gate-title">
        <LockKeyhole size={20} aria-hidden="true" />
        <div>
          <h2 id="gate-title">Finish the intro. Find your next direction.</h2>
          <p>
            Your course hub opens after all {total} missions. Try Git and AI next, and explore the
            roadmap for Linux, networking, containers, Kubernetes, GitOps, and security.
          </p>
          <a className="text-link" href="#community">
            You can explore the community shelf anytime
            <ArrowRight size={14} />
          </a>
        </div>
      </section>
    </main>
  );
}
