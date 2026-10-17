// A small argument tokenizer, not a shell: quotes and escapes are supported;
// operators, substitutions, redirects, and command chaining are not.
export function parseCommand(line: string): string[] {
  if (line.length > 2048) throw new Error('Command is too long (maximum 2,048 characters).');
  const tokens: string[] = [];
  let word = '',
    quote = '',
    escaped = false,
    started = false;
  for (const char of line) {
    if (escaped) {
      word += char;
      escaped = false;
      started = true;
      continue;
    }
    if (char === '\\' && quote !== "'") {
      escaped = true;
      started = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = '';
      else word += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      started = true;
      continue;
    }
    if ('|&;<>`$'.includes(char))
      throw new Error(
        'This practice terminal supports one command at a time. Pipes, redirects, and substitutions are not available.',
      );
    if (/\s/.test(char)) {
      if (started) {
        tokens.push(word);
        word = '';
        started = false;
      }
    } else {
      word += char;
      started = true;
    }
  }
  if (quote) throw new Error('Unclosed quote. Add the matching quote and try again.');
  if (escaped) throw new Error('A backslash needs a character after it.');
  if (started) tokens.push(word);
  return tokens;
}
