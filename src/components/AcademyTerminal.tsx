import { useEffect, useRef, useState } from 'react';
import { courses } from '../courses/catalogue';
import { ACADEMY, academyCommands, runAcademy, type AcademySession } from '../engine/academy';
import { completeCommand } from '../engine/completion';
import { displayPath } from '../engine/filesystem';
import { CommandEntry } from './CommandEntry';

export function AcademyTerminal({
  session,
  onOpen,
}: {
  session: AcademySession;
  onOpen: (id: string) => void;
}) {
  const [machine, setMachine] = useState(session.machine);
  const [entries, setEntries] = useState(session.entries);
  const transcript = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight });
  }, [entries]);
  const current = courses.find(
    (course) =>
      machine.cwd === `${ACADEMY}/${course.id}` ||
      machine.cwd.startsWith(`${ACADEMY}/${course.id}/`),
  );
  function run(line: string) {
    const result = runAcademy(session.machine, line);
    if (result.clear) session.welcome = false;
    session.entries = result.clear
      ? []
      : [
          ...session.entries,
          {
            command: line,
            path: displayPath(session.machine.cwd),
            output: result.output,
            success: result.success,
            listing: result.listing,
          },
        ].slice(-60);
    session.machine = result.machine;
    setMachine(result.machine);
    setEntries(session.entries);
  }
  return (
    <>
      <section className="academy-terminal terminal-window" aria-label="Academy course terminal">
        <div className="terminal-titlebar">
          <div className="window-controls" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>learner@kglab: {displayPath(machine.cwd)}</span>
          <span className="terminal-tab">course browser · simulated</span>
        </div>
        <div
          className="academy-transcript"
          ref={transcript}
          role="log"
          aria-label="Course terminal output"
          aria-live="polite"
          tabIndex={0}
        >
          {session.welcome && (
            <div className="academy-terminal-welcome">
              <p>Welcome to your Academy.</p>
              <p>You’ve completed Terminal Fundamentals. The gate is open.</p>
              <p>
                To see all courses, start with <strong>ls</strong>.
              </p>
            </div>
          )}
          {entries.map((entry, i) => (
            <div className="academy-command-result" key={i}>
              <p className="shell-echo">
                <span>learner@kglab</span>:<span>{entry.path}</span> $ {entry.command}
              </p>
              {entry.listing ? (
                <div className="course-directory" role="table" aria-label="Course directory">
                  <div className="directory-head" role="row">
                    <span role="columnheader">Course</span>
                    <span role="columnheader">Status</span>
                    <span role="columnheader">Explore</span>
                  </div>
                  {courses.map((course) => (
                    <div className="directory-row" role="row" key={course.id}>
                      <span role="cell">
                        <button type="button" onClick={() => run(`cd "${ACADEMY}/${course.id}"`)}>
                          {course.id}/
                        </button>
                      </span>
                      <span role="cell">
                        <span className={`course-state ${course.status}`}>
                          {course.status === 'planned'
                            ? 'Planned'
                            : course.id === 'terminal-fundamentals'
                              ? 'Completed'
                              : 'Available'}
                        </span>
                      </span>
                      <span role="cell">{course.description}</span>
                    </div>
                  ))}
                </div>
              ) : (
                entry.output && (
                  <pre className={entry.success ? '' : 'command-error'}>{entry.output}</pre>
                )
              )}
            </div>
          ))}
        </div>
        <div className="academy-terminal-coach">
          Use <code>cd &lt;course&gt;</code> to explore. <kbd>Tab</kbd> completes course names.{' '}
          <code>cat README.md</code> reads the overview.
        </div>
        <CommandEntry
          label="Academy command"
          path={displayPath(machine.cwd)}
          memory={session.terminal}
          complete={(line, caret) => completeCommand(machine, line, caret, academyCommands)}
          onRun={run}
        />
        <div className="terminal-status">
          <span>
            <i className="status-dot" /> Browser-only course directory
          </span>
          <span>No host shell or server commands</span>
        </div>
      </section>
      {current && (
        <section className="academy-folder" aria-label="Selected course">
          <div>
            <span className="eyebrow">CURRENT COURSE DIRECTORY</span>
            <h2>{current.title}</h2>
            <p>{current.description}</p>
          </div>
          {current.status === 'available' ? (
            <button
              className="button-primary"
              aria-label={
                current.id === 'terminal-fundamentals'
                  ? 'Revisit your terminal'
                  : `Start ${current.title}`
              }
              onClick={() => onOpen(current.id)}
            >
              {current.id === 'terminal-fundamentals'
                ? 'Revisit your terminal'
                : `Start ${current.title}`}{' '}
              →
            </button>
          ) : (
            <p className="planned-tag">Planned · Lessons are not available yet</p>
          )}
        </section>
      )}
      <div className="academy-browser-actions">
        <button className="text-link" onClick={() => run(`ls "${ACADEMY}"`)}>
          Prefer clicking? Browse courses →
        </button>
        <a className="text-link" href="#community">
          Community shelf →
        </a>
      </div>
    </>
  );
}
