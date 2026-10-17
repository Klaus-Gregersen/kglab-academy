import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ChevronDown, ChevronRight, CornerDownLeft, TerminalSquare } from 'lucide-react';
import { HintLightbulb } from './HintLightbulb';
import { displayPath, type Machine } from '../engine/filesystem';
import type { CommandResult } from '../engine/commands';
import { completeCommand, type CompletionCandidate } from '../engine/completion';
import { terminalTips, tipAfterCommand, type TipId } from './terminal-tips';
import { TerminalSettings, type PreferenceProps } from './TerminalSettings';
import { createTerminalMemory, type TerminalMemory } from './terminal-memory';
import '@xterm/xterm/css/xterm.css';

type Props = PreferenceProps & {
  machine: Machine;
  memory?: TerminalMemory;
  onRun: (line: string) => CommandResult;
  preview?: boolean;
};
const safeText = (text: string) =>
  text.replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, '').replace(/\n/g, '\r\n');

export function TerminalPanel({
  machine,
  memory: providedMemory,
  onRun,
  preview = false,
  preferences,
  onPreferencesChange,
  preferencesSaved,
}: Props) {
  const fallbackMemory = useRef(createTerminalMemory());
  const memory = providedMemory ?? fallbackMemory.current;
  const { cwd } = machine;
  const commandId = preview ? 'preview-command' : 'mission-command';
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<Terminal | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [line, setLineState] = useState(memory.draft);
  const [history, setHistory] = useState(memory.history);
  const historyIndex = useRef(memory.history.length);
  function setLine(value: string) {
    memory.draft = value;
    setLineState(value);
  }
  const draft = useRef('');
  const [announcement, setAnnouncement] = useState('');
  const [suggestions, setSuggestions] = useState<CompletionCandidate[]>([]);
  const [completionNotice, setCompletionNotice] = useState('');
  const pendingCaret = useRef<number | null>(null);
  const exitOnTab = useRef(false);
  const [tip, setTip] = useState<TipId>('tab');
  const [tipsOpen, setTipsOpen] = useState(false);
  const seenTips = useRef(new Set<TipId>(['tab']));

  useLayoutEffect(() => {
    if (pendingCaret.current !== null && input.current) {
      input.current.focus({ preventScroll: true });
      input.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  });

  function suggestTip(id: TipId | undefined) {
    if (preferences.hints && id && !seenTips.current.has(id)) {
      seenTips.current.add(id);
      setTip(id);
    }
  }

  function editLine(value: string) {
    setLine(value);
    setSuggestions([]);
    setCompletionNotice('');
    exitOnTab.current = false;
  }

  function chooseCompletion(candidate: CompletionCandidate) {
    pendingCaret.current = candidate.cursor;
    setLine(candidate.line);
    setSuggestions([]);
    setCompletionNotice('Completed. Press Enter when you’re ready to run it.');
    suggestTip('completed');
  }

  function complete() {
    const result = completeCommand(machine, line, input.current?.selectionStart ?? line.length);
    if (result.candidates.length) {
      pendingCaret.current = result.cursor;
      setLine(result.line);
      setSuggestions(result.candidates.length > 1 ? result.candidates : []);
      if (result.line !== line) suggestTip('completed');
    } else setSuggestions([]);
    setCompletionNotice(result.message);
    setAnnouncement(result.message);
    input.current?.focus({ preventScroll: true });
    return result.candidates.length > 0;
  }

  useEffect(() => {
    const term = new Terminal({
      disableStdin: true,
      convertEol: true,
      screenReaderMode: true,
      cursorBlink: false,
      fontSize: 13,
      lineHeight: 1.65,
      fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
      scrollback: 500,
      theme: { background: '#0c1012', foreground: '#c3ccca', selectionBackground: '#334139' },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container.current!);
    instance.current = term;
    // Input belongs to the native form below, not xterm's hidden input buffer.
    term.textarea?.setAttribute('tabindex', '-1');
    term.textarea?.setAttribute('aria-hidden', 'true');
    const resize = () => {
      if (container.current?.clientWidth) fit.fit();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container.current!);
    resize();
    term.writeln('\x1b[38;2;186;245;118mKG LAB Academy\x1b[0m  /  practice environment');
    term.writeln('');
    term.writeln(
      preview
        ? 'Your first command is the beginning of something.'
        : 'Your workspace is ready. Take your time.',
    );
    term.writeln('Type help to explore. Nothing here can break your computer.');
    term.writeln('');
    memory.transcript.forEach((chunk) => term.writeln(chunk));
    term.scrollToBottom();
    setLineState(memory.draft);
    setHistory(memory.history);
    setTipsOpen(false);
    setSuggestions([]);
    setCompletionNotice('');
    exitOnTab.current = false;
    historyIndex.current = memory.history.length;
    return () => {
      observer.disconnect();
      term.dispose();
      instance.current = null;
    };
  }, [memory, preview]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!line.trim()) return;
    const term = instance.current;
    const result = onRun(line);
    suggestTip(tipAfterCommand(result, history.includes(line)));
    function write(chunk: string) {
      memory.transcript = [...memory.transcript, chunk].slice(-200);
      term?.writeln(chunk);
    }
    write(
      `\x1b[38;2;186;245;118mlearner\x1b[0m \x1b[38;2;134;163;170m${safeText(displayPath(cwd))}\x1b[0m $ ${safeText(line)}`,
    );
    if (result.clear) {
      term?.clear();
      memory.transcript = [];
    } else if (result.output)
      write(`${result.success ? '' : '\x1b[38;2;241;167;138m'}${safeText(result.output)}\x1b[0m`);
    term?.scrollToBottom();
    setAnnouncement(result.output || (result.success ? 'Command completed.' : 'Try again.'));
    const next = [...history, line].slice(-100);
    memory.history = next;
    setHistory(next);
    historyIndex.current = next.length;
    editLine('');
    draft.current = '';
    input.current?.focus();
  }

  return (
    <>
      <section
        className={`terminal-window ${preview ? 'terminal-preview' : ''}`}
        aria-label="Simulated terminal"
      >
        <div className="terminal-titlebar">
          <div className="window-controls" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>
            <TerminalSquare size={14} /> learner@kglab: {displayPath(cwd)}
          </span>
          <span className="terminal-tab">bash · simulated</span>
          <TerminalSettings
            id={commandId}
            preferences={preferences}
            onPreferencesChange={onPreferencesChange}
            preferencesSaved={preferencesSaved}
          />
        </div>
        <div
          className="terminal-body"
          ref={container}
          onPointerUp={() => {
            if (!instance.current?.hasSelection() && !window.getSelection()?.toString())
              input.current?.focus({ preventScroll: true });
          }}
        />
        <form className="terminal-command-area" onSubmit={submit}>
          <div className="command-entry-heading">
            <label htmlFor={commandId}>
              <span className="status-dot" /> Type your command here
            </label>
            <button
              type="button"
              className="complete-command"
              onClick={complete}
              aria-label="Complete command or path"
            >
              <kbd>Tab</kbd> Complete
            </button>
          </div>
          <div className="terminal-prompt">
            <span className="prompt-context" aria-hidden="true">
              <span className="prompt-user">learner</span>
              <span className="prompt-path">{displayPath(cwd)}</span>
              <span className="prompt-dollar">$</span>
            </span>
            <input
              ref={input}
              id={commandId}
              aria-label="Terminal command"
              aria-describedby={`${commandId}-keys`}
              value={line}
              placeholder="Click here and start typing…"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={2048}
              onChange={(e) => editLine(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Escape') {
                  setSuggestions([]);
                  exitOnTab.current = true;
                  setCompletionNotice('Press Tab to move to Run, or keep typing.');
                }
                if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
                  if (exitOnTab.current) {
                    exitOnTab.current = false;
                    setSuggestions([]);
                    setCompletionNotice('');
                  } else {
                    // Tab belongs to the terminal even when no name matches.
                    // Escape then Tab explicitly restores forward navigation.
                    e.preventDefault();
                    complete();
                  }
                }
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  seenTips.current.add('history');
                  if (historyIndex.current === history.length) draft.current = line;
                  historyIndex.current = Math.max(
                    0,
                    Math.min(history.length, historyIndex.current + (e.key === 'ArrowUp' ? -1 : 1)),
                  );
                  editLine(
                    historyIndex.current === history.length
                      ? draft.current
                      : history[historyIndex.current],
                  );
                }
                if (e.key === 'c' && e.ctrlKey) {
                  e.preventDefault();
                  editLine('');
                  suggestTip('cancel');
                }
                if (e.key === 'l' && e.ctrlKey) {
                  e.preventDefault();
                  instance.current?.clear();
                  memory.transcript = [];
                }
              }}
            />
            <button type="submit" className="run-command" aria-label="Run command">
              <span>Run</span>
              <CornerDownLeft size={16} />
            </button>
          </div>
          <div
            className={preferences.shortcutGuide ? 'terminal-keys' : 'sr-only'}
            id={`${commandId}-keys`}
          >
            <span>
              <kbd>Enter</kbd> run
            </span>
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> history
            </span>
            <span>
              <kbd>Esc</kbd> then <kbd>Tab</kbd> move on
            </span>
          </div>
          {completionNotice && <p className="completion-notice">{completionNotice}</p>}
          {suggestions.length > 0 && (
            <div
              className="completion-suggestions"
              role="group"
              aria-label="Completion suggestions"
            >
              {suggestions.slice(0, 12).map((candidate) => (
                <button
                  key={candidate.label}
                  type="button"
                  onClick={() => chooseCompletion(candidate)}
                >
                  {candidate.label}
                </button>
              ))}
            </div>
          )}
        </form>
        <div className="terminal-status">
          <span>
            <i className="status-dot" /> Browser sandbox
          </span>
          <span>No server. No risk. Just practice.</span>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </section>
      {preferences.hints && (
        <aside className="terminal-coach" aria-label="Terminal know-how">
          <HintLightbulb key={tip} enabled={preferences.animateHints} size={17} />
          <div>
            <button
              type="button"
              className="coach-toggle"
              aria-label={tipsOpen ? 'Hide terminal tips' : 'Show terminal tips'}
              aria-expanded={tipsOpen}
              aria-controls={`${commandId}-tips`}
              onClick={() => setTipsOpen((value) => !value)}
            >
              <span className="coach-heading">Terminal tips</span>
              <span className="coach-preview">{terminalTips[tip].title}</span>
              <ChevronDown size={14} />
            </button>
            {tipsOpen && (
              <div id={`${commandId}-tips`} className="coach-expanded" aria-live="polite">
                <p>{terminalTips[tip].text}</p>
                <button
                  type="button"
                  className="coach-another"
                  aria-label="Show another terminal tip"
                  onClick={() => {
                    const order: TipId[] = [
                      'tab',
                      'history',
                      'navigation',
                      'spaces',
                      'clear',
                      'cancel',
                    ];
                    const next = order[(order.indexOf(tip) + 1) % order.length];
                    setTip(next);
                    seenTips.current.add(next);
                  }}
                >
                  Another tip
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
