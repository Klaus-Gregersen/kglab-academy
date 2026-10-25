import { useId, useRef, useState } from 'react';
import type { Completion, CompletionCandidate } from '../engine/completion';
import type { TerminalMemory } from './terminal-memory';

export function CommandEntry({
  label,
  path,
  memory,
  complete,
  onRun,
}: {
  label: string;
  path: string;
  memory: TerminalMemory;
  complete: (line: string, caret: number) => Completion;
  onRun: (line: string) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [line, setLine] = useState(memory.draft);
  const [notice, setNotice] = useState('');
  const [suggestions, setSuggestions] = useState<CompletionCandidate[]>([]);
  const index = useRef(memory.history.length);
  const draft = useRef('');
  const exit = useRef(false);
  function edit(value: string) {
    memory.draft = value;
    setLine(value);
    setSuggestions([]);
    setNotice('');
  }
  function choose(value: CompletionCandidate) {
    edit(value.line);
    input.current?.focus({ preventScroll: true });
    requestAnimationFrame(() => input.current?.setSelectionRange(value.cursor, value.cursor));
  }
  function tab() {
    const result = complete(line, input.current?.selectionStart ?? line.length);
    edit(result.line);
    setNotice(result.message);
    setSuggestions(result.candidates.length > 1 ? result.candidates : []);
    input.current?.focus({ preventScroll: true });
    requestAnimationFrame(() => input.current?.setSelectionRange(result.cursor, result.cursor));
  }
  return (
    <form
      className="terminal-command-area course-command-entry"
      onSubmit={(event) => {
        event.preventDefault();
        if (!line.trim()) return;
        onRun(line);
        memory.history = [...memory.history, line].slice(-100);
        index.current = memory.history.length;
        draft.current = '';
        edit('');
        exit.current = false;
        input.current?.focus({ preventScroll: true });
      }}
    >
      <div className="command-entry-heading">
        <label htmlFor={id}>
          <span className="status-dot" />
          Type your command here
        </label>
        <button type="button" className="complete-command" onClick={tab}>
          <kbd>Tab</kbd> Complete
        </button>
      </div>
      <div className="terminal-prompt">
        <span className="prompt-context" aria-hidden="true">
          <span className="prompt-user">learner@kglab</span>
          <span className="prompt-path">{path}</span>
          <span>$</span>
        </span>
        <input
          id={id}
          ref={input}
          aria-label={label}
          aria-describedby={`${id}-keys`}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={2048}
          value={line}
          placeholder="Type a command…"
          onChange={(event) => {
            exit.current = false;
            edit(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              exit.current = true;
              setSuggestions([]);
              setNotice('Press Tab to leave the command input.');
            }
            if (
              event.key === 'Tab' &&
              !event.shiftKey &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.altKey
            ) {
              if (exit.current) exit.current = false;
              else {
                event.preventDefault();
                tab();
              }
            }
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              event.preventDefault();
              if (index.current === memory.history.length) draft.current = line;
              index.current = Math.max(
                0,
                Math.min(memory.history.length, index.current + (event.key === 'ArrowUp' ? -1 : 1)),
              );
              edit(
                index.current === memory.history.length
                  ? draft.current
                  : memory.history[index.current],
              );
            }
            if (event.ctrlKey && event.key === 'c') {
              event.preventDefault();
              edit('');
            }
            if (event.ctrlKey && event.key === 'l') {
              event.preventDefault();
              onRun('clear');
            }
          }}
        />
        <button type="submit" className="run-command" aria-label={`Run ${label.toLowerCase()}`}>
          Run →
        </button>
      </div>
      <div className="terminal-keys" id={`${id}-keys`}>
        <span>Enter to run</span>
        <span>↑ ↓ history</span>
        <span>Escape then Tab to move on</span>
      </div>
      <p className="completion-notice" role="status">
        {notice}
      </p>
      {suggestions.length > 0 && (
        <div className="completion-suggestions" role="group" aria-label="Completion suggestions">
          {suggestions.slice(0, 12).map((candidate) => (
            <button key={candidate.label} type="button" onClick={() => choose(candidate)}>
              {candidate.label}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
