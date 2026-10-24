import {
  ArrowRight,
  BookOpen,
  Check,
  GitBranch,
  LockKeyhole,
  Sparkles,
  TerminalSquare,
  UnlockKeyhole,
} from 'lucide-react';
import { courses } from '../courses/catalogue';

type Props = {
  completed: number;
  total: number;
  started: boolean;
  saved: boolean;
  onTerminal: () => void;
};

export function AcademyPage({ completed, total, started, saved, onTerminal }: Props) {
  const unlocked = completed === total;
  return (
    <main id="academy" className="academy-hub page-width">
      <section className="academy-welcome" aria-labelledby="academy-title">
        <div>
          <div className="eyebrow">
            {unlocked ? 'INTRO COMPLETE · ACADEMY UNLOCKED' : 'YOUR FIRST STEP INTO THE ACADEMY'}
          </div>
          <h1 id="academy-title" tabIndex={-1}>
            {unlocked ? 'You’re through the gate' : 'A little practice opens the gate'}
            <span className="green">.</span>
          </h1>
          <p className="academy-lead">
            {unlocked
              ? 'You built something with your own commands. Now there’s a whole world to connect it to.'
              : 'Complete Terminal Fundamentals to unlock your course hub. Seven small missions. A foundation you can build on.'}
          </p>
          <p>Free to learn. No account needed. One step at a time.</p>
        </div>
        <div className="academy-gate" aria-label={unlocked ? 'Academy unlocked' : 'Academy locked'}>
          {unlocked ? (
            <UnlockKeyhole size={35} aria-hidden="true" />
          ) : (
            <LockKeyhole size={35} aria-hidden="true" />
          )}
          <span>{unlocked ? 'GATE OPEN' : 'INTRO IN PROGRESS'}</span>
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
          <p>
            {unlocked
              ? 'Navigate, create, explore. Those first commands are yours now.'
              : 'Learn your way around a terminal before heading further into the lab.'}
          </p>
        </div>
        <button className="button-primary" onClick={onTerminal}>
          {unlocked ? 'Revisit your terminal' : started ? 'Continue the intro' : 'Start the intro'}
          <ArrowRight size={16} />
        </button>
      </section>

      {unlocked ? (
        <>
          <section className="academy-courses" aria-labelledby="next-courses-title">
            <div className="section-heading">
              <div>
                <div className="eyebrow">YOUR NEXT CHAPTERS</div>
                <h2 id="next-courses-title">Where will your curiosity take you?</h2>
                <p>
                  Your hub is open. These Academy courses are still being built; the free community
                  material is ready to explore.
                </p>
              </div>
            </div>
            <div className="academy-course-grid">
              {courses.slice(1).map((course, i) => (
                <article className="academy-course-card" key={course.id}>
                  <div className="academy-card-top">
                    <span>{String(i + 2).padStart(3, '0')}</span>
                    <span className="planned-tag">Planned</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="academy-course-topics">
                    {course.id === 'ai-fundamentals' ? (
                      <Sparkles size={15} aria-hidden="true" />
                    ) : (
                      <BookOpen size={15} aria-hidden="true" />
                    )}
                    {course.topics}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="academy-community" aria-labelledby="keep-learning-title">
            <GitBranch size={27} aria-hidden="true" />
            <div>
              <div className="eyebrow">KEEP THE MOMENTUM</div>
              <h2 id="keep-learning-title">Good learning is already out there.</h2>
              <p>
                Explore the community shelf for free guides, interactive labs, and resources
                recommended by other learners.
              </p>
            </div>
            <a href="#community" className="text-link">
              Find free learning material
              <ArrowRight size={16} />
            </a>
          </section>
          <p className="academy-save-note">
            <Check size={14} aria-hidden="true" />
            {saved
              ? 'Your intro completion is saved in this browser. No account to keep track of.'
              : 'Your intro is complete for this visit. Browser storage is unavailable, so it cannot be saved.'}
          </p>
        </>
      ) : (
        <section className="academy-locked" aria-labelledby="gate-title">
          <LockKeyhole size={20} aria-hidden="true" />
          <div>
            <h2 id="gate-title">Finish the intro. Find your next direction.</h2>
            <p>
              Your course hub opens after all {total} missions. Upcoming topics include Git, Linux,
              networking, containers, Kubernetes, GitOps, security, and AI.
            </p>
            <a className="text-link" href="#community">
              You can explore the community shelf anytime
              <ArrowRight size={14} />
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
