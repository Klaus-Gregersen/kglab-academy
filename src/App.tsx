import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Code2,
  Command,
  FlaskConical,
  GitBranch,
  LockKeyhole,
  Play,
  RotateCcw,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react';
import { TerminalPanel } from './components/Terminal';
import { createTerminalMemory } from './components/terminal-memory';
import { CommunityPage } from './components/CommunityPage';
import { ResetDialog } from './components/ResetDialog';
import { useTerminalPreferences } from './state/useTerminalPreferences';
import { useIdleNudge } from './state/useIdleNudge';
import { HintLightbulb } from './components/HintLightbulb';
import { MissionWalkthrough } from './components/MissionWalkthrough';
import { learningPath, missions, LAUNCHPAD, type Mission } from './courses/terminal-fundamentals';
import { execute } from './engine/commands';
import { createMachine } from './engine/filesystem';
import {
  advance,
  applyResult,
  browserStorage,
  freshProgress,
  loadProgress,
  saveProgress,
  type Progress,
} from './state/progress';

const REPO = 'https://github.com/Klaus-Gregersen/kglab-academy';

export default function App() {
  const [progress, setProgress] = useState(() => loadProgress(browserStorage()));
  const currentProgress = useRef(progress);
  type View = 'home' | 'lab' | 'community';
  function hashView(): View {
    if (['#community', '#share-resource'].includes(window.location.hash)) return 'community';
    if (['#main', '#learning-path', '#open-source'].includes(window.location.hash)) return 'home';
    return currentProgress.current.started ? 'lab' : 'home';
  }
  const [view, setView] = useState<View>(hashView);
  const [terminalMemory, setTerminalMemory] = useState(createTerminalMemory);
  const [previewMemory] = useState(createTerminalMemory);
  useEffect(() => {
    const navigate = () => setView(hashView());
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView({ block: 'start' });
  }, [view]);
  const [preview, setPreview] = useState(createMachine);
  const [hint, setHint] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [resetCount, setResetCount] = useState(0);
  const [walkthrough, setWalkthrough] = useState<Mission | null>(null);
  const workspace = useRef<HTMLElement>(null);
  const { preferences, changePreferences, preferencesSaved } = useTerminalPreferences();
  const mission = missions[progress.current];
  const complete = progress.completed.includes(mission.id);
  const finished = progress.completed.length === missions.length;
  const percent = Math.round((progress.completed.length / missions.length) * 100);
  const nudged = useIdleNudge({
    enabled:
      view === 'lab' &&
      !complete &&
      !walkthrough &&
      hint === 0 &&
      preferences.hints &&
      preferences.nudges,
    session: `${progress.current}-${resetCount}`,
    delay: preferences.nudgeDelay * 1000,
    scope: workspace,
  });

  function update(next: Progress) {
    currentProgress.current = next;
    setProgress(next);
    setStorageFailed(!saveProgress(next, browserStorage()));
  }
  function start() {
    update({ ...currentProgress.current, started: true });
    setView('lab');
    window.location.hash = 'workspace';
    setTimeout(() => {
      document.getElementById('mission-title')?.focus();
      document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }
  function nextMission() {
    update(advance(currentProgress.current));
    setHint(0);
    setFeedback('');
    setTimeout(() => document.getElementById('mission-command')?.focus(), 0);
  }

  return (
    <>
      <a
        className="skip-link"
        href={view === 'lab' ? '#workspace' : view === 'community' ? '#community' : '#main'}
      >
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setView('home');
              window.location.hash = 'main';
              window.scrollTo({ top: 0 });
            }}
            aria-label="KG LAB Academy home"
          >
            <span className="brand-symbol">
              <TerminalSquare size={21} />
            </span>
            <strong>
              KG LAB<span className="brand-divider">/</span>
              <span className="brand-academy">Academy</span>
            </strong>
          </a>
          <nav aria-label="Main navigation">
            <a href="#learning-path" onClick={() => setView('home')}>
              Learning path
            </a>
            <a href="#open-source" onClick={() => setView('home')}>
              Our philosophy
            </a>
            <a
              className="community-nav"
              href="#community"
              aria-current={view === 'community' ? 'page' : undefined}
              onClick={() => setView('community')}
            >
              Community
            </a>
            <a
              className="github-link"
              href={REPO}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub repository"
            >
              <GitBranch size={17} />
              <span>GitHub</span>
              <ArrowUpRight size={13} />
            </a>
          </nav>
          <button className="header-start" onClick={start}>
            {progress.started ? 'My workspace' : 'Enter the lab'}
            <ArrowUpRight size={15} />
          </button>
        </div>
      </header>

      {storageFailed && (
        <div className="storage-warning" role="status">
          Your browser could not save this session. You can keep learning, but progress may be lost
          when you refresh.
        </div>
      )}

      {view === 'community' ? (
        <CommunityPage />
      ) : view === 'home' ? (
        <main id="main">
          <section className="hero page-width">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="status-dot" /> YOUR WORKSPACE FOR WHAT’S NEXT
              </div>
              <h1>
                Build.
                <br />
                Learn.
                <br />
                <span>
                  Repeat<span className="hero-period">.</span>
                </span>
                <span className="hero-cursor" aria-hidden="true">
                  _
                </span>
              </h1>
              <p className="hero-subtitle">
                Your journey from curious beginner to confident developer starts with one command.
              </p>
              <p className="hero-support">
                Learn real-world development, DevOps, and DevSecOps through short, interactive
                challenges.
              </p>
              <div className="hero-actions">
                <button className="button-primary" onClick={start}>
                  {progress.started ? 'Continue your mission' : 'Start your first mission'}
                  <ArrowRight size={17} />
                </button>
                <a className="text-link" href="#learning-path">
                  Explore the learning path
                  <ArrowDown size={15} />
                </a>
              </div>
              <div className="hero-meta">
                <span>
                  <Check size={13} /> 100% free
                </span>
                <span>
                  <Check size={13} /> No account needed
                </span>
                <span>
                  <Check size={13} /> Yours to explore
                </span>
              </div>
            </div>
            <div className="hero-lab">
              <div className="lab-label">
                <span>01 / A LITTLE CURIOSITY GOES A LONG WAY</span>
                <Command size={14} />
              </div>
              <TerminalPanel
                preferences={preferences}
                onPreferencesChange={changePreferences}
                preferencesSaved={preferencesSaved}
                machine={preview}
                memory={previewMemory}
                preview
                onRun={(line) => {
                  const result = execute(preview, line);
                  setPreview(result.machine);
                  return result;
                }}
              />
              <div className="preview-caption">
                <span className="caption-arrow" aria-hidden="true">
                  ↳
                </span>
                <div>
                  <strong>Yes, you can type in there.</strong>
                  <p>
                    Try <code>ls</code> to look around, or <code>help</code> if you’re curious.
                  </p>
                </div>
                <span className="live-tag">LIVE PLAYGROUND</span>
              </div>
            </div>
          </section>
          <section className="principles page-width" aria-label="Our principles">
            <div>
              <span className="principle-icon">
                <TerminalSquare size={21} />
              </span>
              <div>
                <h2>Learn by doing.</h2>
                <p>Less watching. More “I just did that.”</p>
              </div>
            </div>
            <div>
              <span className="principle-icon">
                <Code2 size={21} />
              </span>
              <div>
                <h2>Build real skills.</h2>
                <p>The tools you’ll actually use out there.</p>
              </div>
            </div>
            <div>
              <span className="principle-icon">
                <GitBranch size={21} />
              </span>
              <div>
                <h2>Open source, always.</h2>
                <p>Free to learn. Open to make better.</p>
              </div>
            </div>
          </section>
          <section className="path-section page-width" id="learning-path">
            <div className="section-heading">
              <div>
                <div className="eyebrow">THE LEARNING PATH</div>
                <h2>One command. A whole new world.</h2>
                <p>Start small. Connect the dots. Build your own virtual homelab.</p>
              </div>
              <span className="path-note">8 chapters. One continuous journey.</span>
            </div>
            <div className="course-list">
              {learningPath.map(([title, description], i) => (
                <div className={`course-row ${i === 0 ? 'available' : ''}`} key={title}>
                  <span className="course-number">{String(i + 1).padStart(3, '0')}</span>
                  <span className="course-icon">
                    {i === 0 ? (
                      <TerminalSquare size={21} />
                    ) : i === 1 ? (
                      <GitBranch size={21} />
                    ) : (
                      <LockKeyhole size={17} />
                    )}
                  </span>
                  <div className="course-description">
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                  {i === 0 ? (
                    <>
                      <span className="course-duration">
                        <Clock3 size={14} />
                        20–30 min · {missions.length} missions
                      </span>
                      <button className="course-start" onClick={start}>
                        {finished ? 'Completed' : progress.started ? 'Continue' : 'Start learning'}
                        <ArrowRight size={16} />
                      </button>
                    </>
                  ) : (
                    <span className="planned-tag">Planned</span>
                  )}
                </div>
              ))}
            </div>
          </section>
          <section className="open-source page-width" id="open-source">
            <div className="open-source-mark">
              <GitBranch size={36} />
            </div>
            <div>
              <div className="eyebrow">BUILT IN THE OPEN</div>
              <h2>Good learning is worth sharing.</h2>
              <p>
                We’re here to help you learn, wherever that happens. When a repo, guide, or course
                teaches something well, we should recommend it and credit the people who made it.
                Found something that helped you? Leave a good trail for the next person.
              </p>
              <p className="contribution-note">
                Our community shelf starts with free resources. Suggest additions through Git;
                guided contributions will come with Git Fundamentals.
              </p>
              <a className="text-link" href="#community" onClick={() => setView('community')}>
                Explore the community shelf <ArrowRight size={15} />
              </a>
            </div>
          </section>
        </main>
      ) : (
        <main ref={workspace} id="workspace" className="workspace page-width">
          <div className="workspace-breadcrumb">
            <span>YOUR WORKSPACE</span>
            <ChevronRight size={13} />
            <span>Terminal Fundamentals</span>
            <span className="workspace-saved">
              <span className="status-dot" />
              {storageFailed ? 'Session only' : 'Saved on this device'}
            </span>
          </div>
          <div className="workspace-heading">
            <div>
              <div className="eyebrow">COURSE 001 · TERMINAL FUNDAMENTALS</div>
              <h1>
                Your First Terminal<span className="green">.</span>
              </h1>
              <p>
                Learn to navigate and interact with a terminal through short, hands-on challenges.
              </p>
            </div>
            <span className="duration">
              <Clock3 size={15} />
              20–30 minutes<span>Beginner friendly</span>
            </span>
          </div>
          <div className="lab-layout">
            <aside className="mission-sidebar" aria-label="Course progress">
              <div className="sidebar-heading">
                <BookOpen size={16} />
                <strong>Your missions</strong>
                <span>
                  {progress.completed.length}/{missions.length}
                </span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Course completion"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <i style={{ width: `${percent}%` }} />
              </div>
              <ol>
                {missions.map((item, i) => (
                  <li
                    key={item.id}
                    className={`${i === progress.current ? 'current' : ''} ${progress.completed.includes(item.id) ? 'done' : ''}`}
                    aria-current={i === progress.current ? 'step' : undefined}
                  >
                    <span className="mission-step">
                      {progress.completed.includes(item.id) ? (
                        <Check size={14} />
                      ) : (
                        String(i + 1).padStart(2, '0')
                      )}
                    </span>
                    {progress.completed.includes(item.id) ? (
                      <button
                        className="mission-revisit"
                        type="button"
                        aria-label={`Revisit ${item.title}`}
                        aria-haspopup="dialog"
                        onClick={() => setWalkthrough(item)}
                      >
                        <span>{item.title}</span>
                        <Play size={12} />
                      </button>
                    ) : (
                      <span>{item.title}</span>
                    )}
                    {i > progress.current && <LockKeyhole size={12} />}
                  </li>
                ))}
              </ol>
              <div className="sidebar-footnote">
                <ShieldCheck size={18} />
                <p>
                  Completed missions can be revisited.
                  <br />
                  A safe place to experiment.
                  <br />
                  Mistakes are part of the process.
                </p>
              </div>
              <button className="reset-button" onClick={() => setResetOpen(true)}>
                <RotateCcw size={13} /> Reset course progress
              </button>
            </aside>
            <div className="mission-workspace">
              <section className="mission-brief">
                <div className="mission-kicker">
                  <span>MISSION {String(progress.current + 1).padStart(3, '0')}</span>
                  <span>
                    <FlaskConical size={13} /> Hands-on challenge
                  </span>
                </div>
                <h2 id="mission-title" tabIndex={-1}>
                  {mission.title}
                </h2>
                <p className="mission-command-intro">
                  <code>{mission.command}</code>
                  <span>{mission.meaning}</span>
                </p>
                <p className="mission-explanation">{mission.explanation}</p>
                <button
                  type="button"
                  className="mission-task"
                  aria-label={`Watch walkthrough for ${mission.title}`}
                  aria-haspopup="dialog"
                  onClick={() => setWalkthrough(mission)}
                >
                  <span className="task-marker">
                    <Play size={17} />
                  </span>
                  <span className="task-copy">
                    <strong>Your objective</strong>
                    <span className="task-description">{mission.task}</span>
                    <span className="watch-cue">
                      {mission.id === 'build-your-launchpad'
                        ? 'Try it first · worked example if you need it'
                        : 'Watch it first'}
                      <ArrowRight size={13} />
                    </span>
                  </span>
                </button>
              </section>
              {mission.id === 'build-your-launchpad' && (
                <ul className="challenge-checklist" aria-label="Project checklist">
                  {[
                    {
                      done: progress.machine.nodes[LAUNCHPAD]?.kind === 'directory',
                      label: 'A launchpad directory inside projects',
                    },
                    {
                      done: progress.machine.nodes[`${LAUNCHPAD}/README.md`]?.kind === 'file',
                      label: 'A README.md inside launchpad',
                    },
                    { done: complete, label: 'Location checked from inside launchpad' },
                  ].map((check) => (
                    <li key={check.label}>
                      <span
                        className={check.done ? 'green' : ''}
                        aria-label={check.done ? 'Complete' : 'To do'}
                      >
                        {check.done ? <Check size={14} /> : '○'}
                      </span>
                      {check.label}
                    </li>
                  ))}
                </ul>
              )}
              <TerminalPanel
                preferences={preferences}
                onPreferencesChange={changePreferences}
                preferencesSaved={preferencesSaved}
                machine={progress.machine}
                memory={terminalMemory}
                onRun={(line) => {
                  const before = currentProgress.current;
                  const result = execute(before.machine, line);
                  const next = applyResult(before, result);
                  update(next);
                  setFeedback(
                    result.success && line.trim() && !next.completed.includes(mission.id)
                      ? `Keep exploring. ${mission.objective}`
                      : '',
                  );
                  return result;
                }}
              />
              {complete ? (
                <section className="success-panel" role="status">
                  <span className="success-icon">
                    <CheckCheck size={22} />
                  </span>
                  <div>
                    <h3>
                      {finished
                        ? 'Your first terminal, conquered.'
                        : 'Mission complete. Nicely done.'}
                    </h3>
                    <p>{mission.completion}</p>
                    {finished && (
                      <p>
                        You’ve completed all {missions.length} missions. Keep experimenting in your
                        sandbox, or explore what’s coming next.
                      </p>
                    )}
                  </div>
                  {!finished ? (
                    <button className="button-primary" onClick={nextMission}>
                      Next mission
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      className="button-primary"
                      onClick={() => {
                        setView('home');
                        window.location.hash = 'learning-path';
                        setTimeout(
                          () => document.getElementById('learning-path')?.scrollIntoView(),
                          0,
                        );
                      }}
                    >
                      Explore the path
                      <ArrowRight size={16} />
                    </button>
                  )}
                </section>
              ) : (
                <div className="mission-support">
                  <div>
                    {preferences.hints && (
                      <button
                        className={`hint-button ${nudged ? 'hint-button-offered' : ''}`}
                        onClick={() => setHint(Math.min(2, hint + 1))}
                      >
                        <HintLightbulb
                          key={nudged ? 'offered' : 'ready'}
                          enabled={preferences.animateHints}
                          size={15}
                        />
                        {hint === 0
                          ? 'Need a nudge?'
                          : hint === 1
                            ? 'Show an example'
                            : 'Example revealed'}
                      </button>
                    )}
                    {nudged && (
                      <div
                        className="stuck-nudge"
                        role="status"
                        aria-label="Learning nudge"
                        data-nudge
                      >
                        <p>Take your time. A small hint is here whenever you want one.</p>
                        <button type="button" onClick={() => setHint(1)}>
                          Show a hint
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    )}
                    {preferences.hints && hint > 0 && (
                      <p>
                        {mission.hint}
                        {hint === 2 && (
                          <>
                            {' '}
                            Run each line separately:
                            <code className="hint-solution">{mission.solution.join('\n')}</code>
                          </>
                        )}
                      </p>
                    )}
                    {feedback && (
                      <p className="gentle-feedback" role="status">
                        {feedback}
                      </p>
                    )}
                  </div>
                  <span>Experiment. There’s no time limit.</span>
                </div>
              )}
              <div className="lesson-contribute">
                <GitBranch size={16} />
                <p>
                  Want to challenge this lesson?{' '}
                  <span>Guided Git contributions are coming with Git Fundamentals.</span>
                </p>
                <a
                  href={`${REPO}/tree/main/src/courses`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View course source on GitHub"
                >
                  <ArrowUpRight size={17} />
                </a>
              </div>
            </div>
          </div>
        </main>
      )}
      <footer className="site-footer page-width">
        <span>
          <TerminalSquare size={16} />
          <strong>KG LAB</strong> Academy
        </span>
        <p>Build. Learn. Repeat.</p>
        <a href={REPO} target="_blank" rel="noreferrer">
          Made for the curious.
          <ArrowUpRight size={13} />
        </a>
      </footer>
      {resetOpen && (
        <ResetDialog
          onClose={() => setResetOpen(false)}
          onReset={() => {
            update({ ...freshProgress(), started: true });
            setResetCount((n) => n + 1);
            setTerminalMemory(createTerminalMemory());
            setHint(0);
            setFeedback('');
            setResetOpen(false);
            setTimeout(() => document.getElementById('mission-command')?.focus(), 0);
          }}
        />
      )}
      {walkthrough && (
        <MissionWalkthrough
          mission={walkthrough}
          reviewing={progress.completed.includes(walkthrough.id)}
          onClose={() => setWalkthrough(null)}
          onTry={() => {
            setWalkthrough(null);
            setTimeout(() => document.getElementById('mission-command')?.focus(), 0);
          }}
        />
      )}
    </>
  );
}
