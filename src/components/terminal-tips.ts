import type { CommandResult } from '../engine/commands';

export const terminalTips = {
  tab: {
    title: 'Let Tab do the typing.',
    text: 'Type a few letters, then press Tab to complete a command or path. Try the Complete button on a phone. Nothing runs until you press Enter.',
  },
  completed: {
    title: 'You just used Tab completion.',
    text: 'A / at the end means a directory. Keep typing after it, then press Tab again to explore names inside. Several matches? Add another letter or choose one.',
  },
  history: {
    title: 'No need to type that twice.',
    text: 'Press ↑ to bring back your last command. Edit it and press Enter to try again. Press ↓ to return to what you were typing.',
  },
  navigation: {
    title: 'A couple of handy shortcuts.',
    text: 'cd .. moves up one directory. cd ~ takes you home. And cd - jumps back to your previous directory.',
  },
  spaces: {
    title: 'Spaces in a name?',
    text: 'Wrap the name in quotes, like mkdir "my project". Tab completion handles the spaces for you when you use that path later.',
  },
  clear: {
    title: 'Give yourself a clean workspace.',
    text: 'clear or Ctrl+L clears the display, while your files and progress stay put. You can keep experimenting from the same directory.',
  },
  cancel: {
    title: 'Change your mind mid-command?',
    text: 'Ctrl+C clears the command you’re typing here. You can start again without changing any files.',
  },
};
export type TipId = keyof typeof terminalTips;

export function tipAfterCommand(result: CommandResult, repeated: boolean): TipId | undefined {
  if (repeated || !result.success) return 'history';
  if (result.command === 'cd') return 'navigation';
  if (result.command === 'mkdir' || result.command === 'touch') return 'spaces';
  if (result.command === 'help' || result.command === 'cat') return 'clear';
  return undefined;
}
