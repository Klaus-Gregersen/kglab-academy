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
import { missions, LAUNCHPAD, type Mission } from './courses/terminal-fundamentals';
import { courses } from './courses/catalogue';
import { findShortCourse, shortCourses } from './courses/short-courses';
import { AcademyPage } from './components/AcademyPage';
import { CourseWorkspace } from './components/CourseWorkspace';
import { createAcademySession } from './engine/academy';
import { execute } from './engine/commands';
import { createMachine } from './engine/filesystem';
import { applyPracticeResult, freshPractice, type Practice } from './state/practice';
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

function focusMissionBrief() {
  document.getElementById('mission-title')?.focus({ preventScroll: true });
  document.getElementById('mission-brief')?.scrollIntoView({ block: 'start', behavior: 'instant' });
}

export default function App() {
  const [progress, setProgress] = useState(() => loadProgress(browserStorage()));
  const currentProgress = useRef(progress);
  const [courseId, setCourseId] = useState(() =>
    window.location.hash.startsWith('#course/')
      ? window.location.hash.slice(8)
      : shortCourses[0].id,
  );
  const [academySession] = useState(createAcademySession);
  const activeCourse = findShortCourse(courseId) ?? shortCourses[0];
  type View = 'home' | 'lab' | 'community' | 'academy' | 'course';
  function hashView(): View {
    if (window.location.hash.startsWith('#course/'))
      return currentProgress.current.completed.length === missions.length &&
        findShortCourse(window.location.hash.slice(8))
        ? 'course'
        : 'academy';
    if (window.location.hash === '#academy') return 'academy';
    if (window.location.hash === '#workspace') return 'lab';
    if (['#community', '#share-resource'].includes(window.location.hash)) return 'community';
    if (['#main', '#learning-path', '#open-source'].includes(window.location.hash)) return 'home';
    if (currentProgress.current.completed.length === missions.length) return 'academy';
    return currentProgress.current.started ? 'lab' : 'home';
  }
  const [view, setView] = useState<View>(hashView);
  const [terminalMemory, setTerminalMemory] = useState(createTerminalMemory);
  const [practice, setPractice] = useState<Practice | null>(null);
  const currentPractice = useRef(practice);
  const [practiceMemory, setPracticeMemory] = useState(createTerminalMemory);
  const [practiceVisit, setPracticeVisit] = useState(0);
  const [previewMemory] = useState(createTerminalMemory);
  useEffect(() => {
    const navigate = () => {
      if (
        window.location.hash.startsWith('#course/') &&
        findShortCourse(window.location.hash.slice(8))
      )
        setCourseId(window.location.hash.slice(8));
      setView(hashView());
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView({ block: 'start' });
    if (view === 'academy') {
      document.getElementById('academy-title')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
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
  const missionIndex = practice?.missionIndex ?? progress.current;
  const mission = missions[missionIndex];
  const machine = practice?.machine ?? progress.machine;
  const complete = practice ? practice.complete : progress.completed.includes(mission.id);
  const finished = progress.completed.length === missions.length;
  const percent = Math.round((progress.completed.length / missions.length) * 100);
  useEffect(() => {
    if (view !== 'lab') return;
    // Workspace entry has its own reading position, including after a reload.
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, [view]);
  useEffect(() => {
    if (view !== 'lab') return;
    focusMissionBrief();
    // Lazy terminal styles can change the initial layout after reload. Keep the reading
    // position stable only while the mission heading still has the learner's focus.
    const title = document.getElementById('mission-title');
    const observer = new ResizeObserver(() => {
      if (document.activeElement === title) focusMissionBrief();
    });
    if (workspace.current) observer.observe(workspace.current);
    return () => observer.disconnect();
  }, [view, missionIndex, practiceVisit, resetCount]);
  const nudged = useIdleNudge({
    enabled:
      view === 'lab' &&
      !complete &&
      !walkthrough &&
      hint === 0 &&
      preferences.hints &&
      preferences.nudges,
    session: `${missionIndex}-${resetCount}-${practiceVisit}`,
    delay: preferences.nudgeDelay * 1000,
    scope: workspace,
  });

  function update(next: Progress) {
    currentProgress.current = next;
    setProgress(next);
    setStorageFailed(!saveProgress(next, browserStorage()));
  }
  function start() {
    if (currentProgress.current.completed.length === missions.length) {
      beginPractice(0);
      return;
    }
    leavePractice();
    update({ ...currentProgress.current, started: true });
    setView('lab');
    window.location.hash = 'workspace';
    if (view === 'lab') focusMissionBrief();
  }
  function beginPractice(index: number) {
    if (!currentProgress.current.completed.includes(missions[index]?.id)) return;
    const next = freshPractice(index);
    currentPractice.current = next;
    setPractice(next);
    setPracticeMemory(createTerminalMemory());
    setPracticeVisit((n) => n + 1);
    setHint(0);
    setFeedback('');
    setWalkthrough(null);
    setView('lab');
    window.location.hash = 'workspace';
  }
  function leavePractice() {
    currentPractice.current = null;
    setPractice(null);
    setPracticeVisit((n) => n + 1);
    setHint(0);
    setFeedback('');
  }
  function openAcademy() {
    setView('academy');
    window.location.hash = 'academy';
  }
  function openCourse(id: string) {
    if (currentProgress.current.completed.length !== missions.length) {
      openAcademy();
      return;
    }
    if (id === 'terminal-fundamentals') {
      beginPractice(0);
      return;
    }
    if (!findShortCourse(id)) return;
    setCourseId(id);
    setView('course');
    window.location.hash = `course/${id}`;
  }
  function nextMission() {
    update(advance(currentProgress.current));
    setHint(0);
    setFeedback('');
  }

  return (
    <>
      <a
        className="skip-link"
        onClick={(event) => {
          if (view === 'course') {
            event.preventDefault();
            document.getElementById('course-lesson-title')?.focus({ preventScroll: true });
            document
              .getElementById('course-brief')
              ?.scrollIntoView({ block: 'start', behavior: 'instant' });
          }
        }}
        href={
          view === 'lab'
            ? '#workspace'
            : view === 'community'
              ? '#community'
              : view === 'academy'
                ? '#academy'
                : view === 'course'
                  ? '#course'
                  : '#main'
        }
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
              className="academy-nav"
              href="#academy"
              aria-current={view === 'academy' || view === 'course' ? 'page' : undefined}
              onClick={openAcademy}
            >
              Academy
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
          <button className="header-start" onClick={finished ? openAcademy : start}>
            {finished ? 'My academy' : progress.started ? 'My workspace' : 'Enter the lab'}
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

      {view === 'course' && finished ? (
        <CourseWorkspace key={activeCourse.id} course={activeCourse} onBack={openAcademy} />
      ) : view === 'academy' ? (
        <AcademyPage
          completed={progress.completed.length}
          total={missions.length}
          started={progress.started}
          saved={!storageFailed}
          onTerminal={start}
          session={academySession}
          onOpen={openCourse}
        />
      ) : view === 'community' ? (
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
                <button className="button-primary" onClick={finished ? openAcademy : start}>
                  {finished
                    ? 'Explore your academy'
                    : progress.started
                      ? 'Continue your mission'
                      : 'Start your first mission'}
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
              <span className="path-note">{courses.length} chapters. One continuous journey.</span>
            </div>
            <div className="course-list">
              {courses.map(({ id, title, description, status }, i) => (
                <div className={`course-row ${status === 'available' ? 'available' : ''}`} key={id}>
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
                      <button className="course-start" onClick={finished ? openAcademy : start}>
                        {finished
                          ? 'Academy unlocked'
                          : progress.started
                            ? 'Continue'
                            : 'Start learning'}
                        <ArrowRight size={16} />
                      </button>
                    </>
                  ) : status === 'available' ? (
                    finished ? (
                      <button className="course-start" onClick={() => openCourse(id)}>
                        Start learning <ArrowRight size={16} />
                      </button>
                    ) : (
                      <span className="planned-tag">Available after intro</span>
                    )
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
              {practice
                ? 'Practice · session only'
                : storageFailed
                  ? 'Session only'
                  : 'Saved on this device'}
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
                    className={`${i === missionIndex ? 'current' : ''} ${progress.completed.includes(item.id) ? 'done' : ''}`}
                    aria-current={i === missionIndex ? 'step' : undefined}
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
                        onClick={() => beginPractice(i)}
                      >
                        <span>{item.title}</span>
                        <RotateCcw size={12} />
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
                  Choose a completed mission to practice again.
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
              <section id="mission-brief" className="mission-brief" aria-labelledby="mission-title">
                <div className="mission-kicker">
                  <span>MISSION {String(missionIndex + 1).padStart(3, '0')}</span>
                  <span>
                    <BookOpen size={14} /> Start here
                  </span>
                </div>
                {practice && (
                  <div className="practice-banner" role="region" aria-label="Mission practice">
                    <div>
                      <strong>Practice mode</strong>
                      <p>Your course completion and saved workspace stay unchanged.</p>
                    </div>
                    <button type="button" className="text-link" onClick={leavePractice}>
                      Return to your course <ArrowRight size={14} />
                    </button>
                  </div>
                )}
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
                <p className="mission-practice-cue">
                  <TerminalSquare size={14} aria-hidden="true" />
                  Read the goal. Then try it in the terminal below.
                </p>
              </section>
              {mission.id === 'build-your-launchpad' && (
                <ul className="challenge-checklist" aria-label="Project checklist">
                  {[
                    {
                      done: machine.nodes[LAUNCHPAD]?.kind === 'directory',
                      label: 'A launchpad directory inside projects',
                    },
                    {
                      done: machine.nodes[`${LAUNCHPAD}/README.md`]?.kind === 'file',
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
                machine={machine}
                memory={practice ? practiceMemory : terminalMemory}
                onRun={(line) => {
                  const rehearsal = currentPractice.current;
                  if (rehearsal) {
                    const result = execute(rehearsal.machine, line);
                    const next = applyPracticeResult(rehearsal, result);
                    currentPractice.current = next;
                    setPractice(next);
                    setFeedback(
                      result.success && line.trim() && !next.complete
                        ? `Keep exploring. ${mission.objective}`
                        : '',
                    );
                    return result;
                  }
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
                      {practice
                        ? 'Practice complete. Nicely done.'
                        : finished
                          ? 'Your first terminal, conquered.'
                          : 'Mission complete. Nicely done.'}
                    </h3>
                    <p>{mission.completion}</p>
                    {finished && !practice && (
                      <p>
                        You’ve completed all {missions.length} missions. Keep experimenting in your
                        sandbox, or step through the gate into your Academy.
                      </p>
                    )}
                  </div>
                  {practice ? (
                    <button className="button-primary" onClick={() => beginPractice(missionIndex)}>
                      Practice again <RotateCcw size={16} />
                    </button>
                  ) : !finished ? (
                    <button className="button-primary" onClick={nextMission}>
                      Next mission
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button className="button-primary" onClick={openAcademy}>
                      Unlock your academy
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
            leavePractice();
            update({ ...freshProgress(), started: true });
            setResetCount((n) => n + 1);
            setTerminalMemory(createTerminalMemory());
            setHint(0);
            setFeedback('');
            setResetOpen(false);
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
