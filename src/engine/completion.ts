import { children, HOME, resolvePath, type Machine } from './filesystem';
import { parseCommand } from './parser';

export const COMMAND_NAMES = ['pwd', 'ls', 'cd', 'mkdir', 'touch', 'cat', 'clear', 'help'];
export type CompletionCandidate = { label: string; line: string; cursor: number };
export type Completion = {
  line: string;
  cursor: number;
  candidates: CompletionCandidate[];
  message: string;
};

// Unlike execution, completion must accept unfinished quotes and a caret in the
// middle of an argument. It replaces only that argument, preserving later text.
function tokenAt(line: string, cursor: number) {
  let start = 0,
    value = '',
    quote = '',
    escaped = false;
  for (let i = 0; i < cursor; i++) {
    const char = line[i];
    if (escaped) {
      value += char;
      escaped = false;
      continue;
    }
    if (char === '\\' && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = '';
      else value += char;
    } else if (char === '"' || char === "'") quote = char;
    else if (/\s/.test(char)) {
      start = i + 1;
      value = '';
    } else if ('|&;<>`$'.includes(char)) return null;
    else value += char;
  }
  // Preserve the rest of the command, including arguments after the active one.
  let end = cursor;
  for (; end < line.length; end++) {
    const char = line[end];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\' && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (/\s/.test(char)) break;
  }
  return { start, end, value };
}

function encode(value: string, original: string) {
  if (original.startsWith("'") && !value.includes("'")) return `'${value}'`;
  if (original.startsWith('"')) return `"${value.replace(/[\\"]/g, '\\$&')}"`;
  // These escapes are understood by our tokenizer; no shell is invoked.
  return value.replace(/[\s\\'"|&;<>`$]/g, '\\$&');
}

export function completeCommand(machine: Machine, line: string, caret = line.length): Completion {
  const cursor = Math.max(0, Math.min(caret, line.length));
  const empty: Completion = {
    line,
    cursor,
    candidates: [],
    message: 'No matching completions. Keep typing, or use ls to look around.',
  };
  if (line.length > 2048) return empty;
  const token = tokenAt(line, cursor);
  if (!token) return empty;
  let before: string[];
  try {
    before = parseCommand(line.slice(0, token.start));
  } catch {
    return empty;
  }
  let matches: { value: string; directory: boolean }[];
  if (!before.length) {
    matches = COMMAND_NAMES.filter((name) => name.startsWith(token.value)).map((value) => ({
      value,
      directory: false,
    }));
  } else {
    if (!['ls', 'cd', 'mkdir', 'touch', 'cat'].includes(before[0]) || token.value.startsWith('-'))
      return empty;
    if (before[0] === 'cd' && before.length > 1) return empty;
    const slash = token.value.lastIndexOf('/');
    const prefix = token.value.slice(0, slash + 1);
    const name = token.value.slice(slash + 1);
    const parent = resolvePath(machine.cwd, prefix || '.');
    if (machine.nodes[parent]?.kind !== 'directory') return empty;
    matches = children(machine, parent, name.startsWith('.'))
      .filter(
        (path) =>
          path.split('/').at(-1)!.startsWith(name) &&
          (before[0] !== 'cd' || machine.nodes[path].kind === 'directory'),
      )
      .map((path) => {
        const directory = machine.nodes[path].kind === 'directory';
        return { value: prefix + path.split('/').at(-1)! + (directory ? '/' : ''), directory };
      });
    if (name === '.' || name === '..') {
      matches.push(
        ...['.', '..']
          .filter((part) => part.startsWith(name))
          .map((part) => ({ value: prefix + part + '/', directory: true })),
      );
    }
    if (token.value === '~' && machine.nodes[HOME]?.kind === 'directory')
      matches = [{ value: '~/', directory: true }];
  }
  if (!matches.length) return empty;
  const replace = (value: string, finished: boolean, directory: boolean) => {
    let replacement = encode(value, line.slice(token.start, token.end));
    if (finished && !directory && !/\s/.test(line[token.end] ?? '')) replacement += ' ';
    return {
      line: line.slice(0, token.start) + replacement + line.slice(token.end),
      cursor: token.start + replacement.length,
    };
  };
  const candidates = matches.map((match) => ({
    label: match.value,
    ...replace(match.value, true, match.directory),
  }));
  let shared = matches[0].value;
  for (const match of matches.slice(1)) {
    while (!match.value.startsWith(shared)) shared = shared.slice(0, -1);
  }
  const completed =
    matches.length === 1
      ? candidates[0]
      : shared.length > token.value.length
        ? replace(shared, false, false)
        : { line, cursor };
  return {
    ...completed,
    candidates,
    message:
      matches.length === 1
        ? `Completed ${matches[0].value}. Press Enter to run your command.`
        : `${matches.length} matches: ${matches
            .slice(0, 6)
            .map((match) => match.value)
            .join(
              ', ',
            )}${matches.length > 6 ? ', …' : ''}. Type more letters or choose a suggestion.`,
  };
}
