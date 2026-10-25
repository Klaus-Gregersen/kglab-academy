import { useEffect, useState } from 'react';
import type { ShortCourse } from '../courses/short-courses';
import {
  loadCourseProgress,
  saveCourseProgress,
  type CourseProgress,
} from '../state/course-progress';
import { browserStorage } from '../state/progress';
import { GitLab } from './GitLab';
import { AILab } from './AILab';

export function CourseWorkspace({ course, onBack }: { course: ShortCourse; onBack: () => void }) {
  const [progress, setProgress] = useState(() => loadCourseProgress(course, browserStorage()));
  const [saved, setSaved] = useState(true);
  const [attempt, setAttempt] = useState(false);
  const [restart, setRestart] = useState(0);
  const lesson = course.lessons[progress.current];
  const complete = progress.completed.includes(lesson.id);
  const finished = progress.completed.length === course.lessons.length;
  useEffect(() => {
    document.getElementById('course-lesson-title')?.focus({ preventScroll: true });
    document
      .getElementById('course-brief')
      ?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [progress.current, restart]);
  function update(next: CourseProgress) {
    setProgress(next);
    setSaved(saveCourseProgress(course, next, browserStorage()));
  }
  function select(index: number) {
    update({ ...progress, current: index });
    setAttempt(false);
    setRestart((n) => n + 1);
  }
  function completed() {
    setAttempt(true);
    if (!complete) update({ ...progress, completed: [...progress.completed, lesson.id] });
  }
  return (
    <main id="course" className="workspace page-width">
      <div className="workspace-breadcrumb">
        <button className="text-link" onClick={onBack}>
          ← Back to Academy terminal
        </button>
        <span className="workspace-saved">
          {saved
            ? 'Lesson progress saved in this browser'
            : 'Session only · Progress could not be saved'}
        </span>
      </div>
      <div className="workspace-heading">
        <div>
          <div className="eyebrow">HANDS-ON INTRODUCTION</div>
          <h1>
            {course.title}
            <span className="green">.</span>
          </h1>
          <p>{course.description}</p>
        </div>
        <span className="duration">{course.duration}</span>
      </div>
      <div className="lab-layout">
        <aside className="mission-sidebar" aria-label="Lesson progress">
          <div className="sidebar-heading">
            <strong>Your lessons</strong>
            <span>
              {progress.completed.length}/{course.lessons.length}
            </span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label={`${course.title} completion`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((progress.completed.length / course.lessons.length) * 100)}
          >
            <i style={{ width: `${(progress.completed.length / course.lessons.length) * 100}%` }} />
          </div>
          <ol>
            {course.lessons.map((item, index) => (
              <li
                key={item.id}
                className={`${index === progress.current ? 'current' : ''} ${progress.completed.includes(item.id) ? 'done' : ''}`}
                aria-current={index === progress.current ? 'step' : undefined}
              >
                <button className="mission-revisit" onClick={() => select(index)}>
                  <span>
                    {progress.completed.includes(item.id) ? '✓ ' : `${index + 1}. `}
                    {item.title}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="course-session-note">
            Each activity opens a fresh learning example. Earned lesson completion is saved
            separately.
          </p>
        </aside>
        <div className="mission-workspace">
          <section
            id="course-brief"
            className="mission-brief"
            aria-labelledby="course-lesson-title"
          >
            <div className="mission-kicker">
              <span>LESSON {String(progress.current + 1).padStart(3, '0')}</span>
              <span>Start here</span>
            </div>
            <h2 id="course-lesson-title" tabIndex={-1}>
              {lesson.title}
            </h2>
            <p className="mission-command-intro">{lesson.meaning}</p>
            <p className="mission-explanation">{lesson.explanation}</p>
            <div className="course-objective">
              <strong>Your objective</strong>
              <p>{lesson.objective}</p>
            </div>
            <details className="course-example">
              <summary>See a worked example</summary>
              <pre>{lesson.example}</pre>
            </details>
            <details className="course-example">
              <summary>Need a hint?</summary>
              <p>{lesson.hint}</p>
            </details>
          </section>
          <div key={`${lesson.id}-${restart}`}>
            {course.id === 'git-fundamentals' ? (
              <GitLab lesson={lesson.id} onComplete={completed} />
            ) : (
              <AILab lesson={lesson.id} onComplete={completed} />
            )}
          </div>
          {(complete || attempt) && (
            <section className="success-panel" role="status">
              <div>
                <h3>
                  {attempt
                    ? 'Lesson complete. Nicely done.'
                    : 'Completed earlier. Ready to practise again.'}
                </h3>
                <p>
                  {finished
                    ? 'All lessons completed. You can revisit any activity or explore another course.'
                    : 'Your lesson completion is saved independently of the terminal introduction.'}
                </p>
              </div>
              {progress.current < course.lessons.length - 1 ? (
                <button className="button-primary" onClick={() => select(progress.current + 1)}>
                  Next lesson →
                </button>
              ) : (
                <button className="button-primary" onClick={onBack}>
                  Explore another course →
                </button>
              )}
            </section>
          )}
          <button
            className="reset-button"
            onClick={() => {
              setAttempt(false);
              setRestart((n) => n + 1);
            }}
          >
            Restart this activity
          </button>
          <div className="course-sources">
            <strong>Keep learning from the source</strong>
            {course.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                {source.title} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
