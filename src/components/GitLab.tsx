import { useEffect, useRef, useState } from 'react';
import { completeGit, createGitRepo, gitGoal, gitHead, runGit } from '../engine/git';
import { createTerminalMemory } from './terminal-memory';
import { CommandEntry } from './CommandEntry';

export function GitLab({ lesson, onComplete }: { lesson: string; onComplete: () => void }) {
  const [repo, setRepo] = useState(() => createGitRepo(lesson));
  const current = useRef(repo);
  const [memory] = useState(createTerminalMemory);
  const [output, setOutput] = useState<{ line: string; output: string; success: boolean }[]>([]);
  const transcript = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight });
  }, [output]);
  const lastCommit = gitHead(repo);
  function run(line: string) {
    const result = runGit(current.current, line);
    current.current = result.repo;
    setRepo(result.repo);
    setOutput((before) =>
      result.clear
        ? []
        : [...before, { line, output: result.output, success: result.success }].slice(-80),
    );
    if (result.success && gitGoal(lesson, result.repo, line)) onComplete();
  }
  return (
    <section className="git-lab" aria-label="Simulated Git repository">
      <div className="git-state-grid">
        <div>
          <span>WORKING TREE</span>
          <strong>README.md</strong>
          <label className="sr-only" htmlFor="git-readme">
            Edit README.md
          </label>
          <textarea
            id="git-readme"
            value={repo.working}
            maxLength={4000}
            spellCheck={false}
            onChange={(event) => {
              const next = { ...current.current, working: event.target.value };
              current.current = next;
              setRepo(next);
            }}
          />
        </div>
        <div>
          <span>STAGING AREA</span>
          <strong>
            {repo.staged === null ? 'No selected changes' : 'Selected README.md snapshot'}
          </strong>
          <pre>{repo.staged ?? '(same snapshot as HEAD)'}</pre>
        </div>
        <div>
          <span>LATEST COMMIT · {repo.branch}</span>
          <strong>
            {lastCommit.id} · {lastCommit.message}
          </strong>
          <pre>{lastCommit.content}</pre>
        </div>
      </div>
      <div className="terminal-window">
        <div className="terminal-titlebar">learner@kglab: ~/git-lab · {repo.branch}</div>
        <div
          className="git-transcript"
          ref={transcript}
          role="log"
          aria-label="Git output"
          aria-live="polite"
        >
          <p>
            Fresh demo repository for this lesson. Edit the working file above, then try a Git
            command. Type help for supported commands.
          </p>
          {output.map((entry, i) => (
            <div key={i}>
              <p className="shell-echo">$ {entry.line}</p>
              {entry.output && (
                <pre className={entry.success ? '' : 'command-error'}>{entry.output}</pre>
              )}
            </div>
          ))}
        </div>
        <CommandEntry
          label="Git command"
          path={`~/git-lab (${repo.branch})`}
          memory={memory}
          complete={completeGit}
          onRun={run}
        />
        <div className="terminal-status">
          <span>Simulated local repository · Demo commit IDs</span>
          <span>No GitHub connection</span>
        </div>
      </div>
    </section>
  );
}
