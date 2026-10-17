// Session-only: shared across mission transitions and page navigation, never persisted.
export type TerminalMemory = { history: string[]; transcript: string[]; draft: string };
export const createTerminalMemory = (): TerminalMemory => ({
  history: [],
  transcript: [],
  draft: '',
});
