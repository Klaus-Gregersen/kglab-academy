import { children, HOME, parentPath, resolvePath, type Machine } from './filesystem';
import { parseCommand } from './parser';

export type CommandResult = {
  machine: Machine;
  command: string;
  args: string[];
  paths: string[];
  output: string;
  success: boolean;
  clear?: boolean;
};
const HELP = `Available commands

  pwd             Show your current directory
  ls [-a] [path]  List files and directories
  cd [path]       Change directory (.. goes up, ~ goes home)
  mkdir [-p] path Create a directory (-p creates parents)
  touch path      Create an empty file
  cat path        Read a file
  clear           Clear the terminal
  help            Show this guide

Type part of a command or path, then press Tab to complete it.
On a phone, use the Complete button. Enter runs your command.
Up/down recalls commands. Use quotes for names with spaces.
Shift+Tab or Escape then Tab moves out of the command input.
This is a browser simulation. No commands run on a server.`;

export function execute(machine: Machine, line: string): CommandResult {
  const next: Machine = { ...machine, nodes: { ...machine.nodes } };
  const result: CommandResult = {
    machine: next,
    command: '',
    args: [],
    paths: [],
    output: '',
    success: true,
  };
  try {
    const [command = '', ...args] = parseCommand(line);
    result.command = command;
    result.args = args;
    const fail = (message: string): never => {
      throw new Error(`${command}: ${message}`);
    };
    const noArgs = () => {
      if (args.length) fail('this command does not take arguments');
    };
    const pathFor = (arg: string) => {
      if (!arg) fail('path cannot be empty');
      if (/[\x00-\x1f\x7f]/.test(arg) || arg.length > 240)
        fail('use a path without control characters, up to 240 characters');
      const path = resolvePath(next.cwd, arg);
      if (path.length > 1024) fail('path is too long');
      return path;
    };
    const requireNode = (path: string) => {
      const node = next.nodes[path];
      if (!node) fail(`${path}: No such file or directory`);
      return node;
    };
    const requireParent = (path: string) => {
      const parent = requireNode(parentPath(path));
      if (parent.kind !== 'directory') fail(`${parentPath(path)}: Not a directory`);
    };
    const requireOperands = () => {
      if (!args.length) fail('missing path. Type help to see an example.');
    };
    switch (command) {
      case '':
        break;
      case 'help':
        noArgs();
        result.output = HELP;
        break;
      case 'clear':
        noArgs();
        result.clear = true;
        break;
      case 'pwd':
        noArgs();
        result.output = next.cwd;
        result.paths = [next.cwd];
        break;
      case 'ls': {
        const all = args.includes('-a');
        const operands = args.filter((arg) => arg !== '-a');
        if (operands.some((arg) => arg.startsWith('-')))
          fail('supported option: -a (include hidden files)');
        const paths = (operands.length ? operands : ['.']).map(pathFor);
        result.paths = paths;
        result.output = paths
          .map((path) => {
            const node = requireNode(path);
            const listing =
              node.kind === 'file'
                ? path.split('/').at(-1)!
                : children(next, path, all)
                    .map(
                      (child) =>
                        child.split('/').at(-1) +
                        (next.nodes[child].kind === 'directory' ? '/' : ''),
                    )
                    .join('   ');
            return paths.length > 1 ? `${path}:\n${listing}` : listing;
          })
          .join('\n\n');
        break;
      }
      case 'cd': {
        if (args.length > 1) fail('too many arguments');
        const path = args[0] === '-' ? next.previous : pathFor(args[0] ?? HOME);
        if (requireNode(path).kind !== 'directory') fail(`${path}: Not a directory`);
        next.previous = next.cwd;
        next.cwd = path;
        result.paths = [path];
        if (args[0] === '-') result.output = path;
        break;
      }
      case 'mkdir': {
        requireOperands();
        const recursive = args.includes('-p');
        const operands = args.filter((arg) => arg !== '-p');
        if (!operands.length) fail('missing directory name');
        for (const arg of operands) {
          if (arg.startsWith('-')) fail('supported option: -p (create parent directories)');
          const path = pathFor(arg);
          if (next.nodes[path] && !(recursive && next.nodes[path].kind === 'directory'))
            fail(`${arg}: File exists`);
          const paths = recursive
            ? path
                .split('/')
                .slice(1)
                .map((_, i, parts) => '/' + parts.slice(0, i + 1).join('/'))
            : [path];
          for (const part of paths) {
            requireParent(part);
            if (next.nodes[part]?.kind === 'file') fail(`${part}: Not a directory`);
            next.nodes[part] = { kind: 'directory' };
          }
          result.paths.push(path);
        }
        break;
      }
      case 'touch': {
        requireOperands();
        for (const arg of args) {
          if (arg.startsWith('-')) fail('options are not supported');
          const path = pathFor(arg);
          requireParent(path);
          if (!next.nodes[path]) next.nodes[path] = { kind: 'file', content: '' };
          result.paths.push(path);
        }
        break;
      }
      case 'cat': {
        requireOperands();
        result.output = args
          .map((arg) => {
            const path = pathFor(arg),
              node = requireNode(path);
            if (node.kind !== 'file') fail(`${arg}: Is a directory`);
            result.paths.push(path);
            return node.kind === 'file' ? node.content : '';
          })
          .join('');
        break;
      }
      default:
        fail('command not found. Type help to explore the available commands.');
    }
    if (Object.keys(next.nodes).length > 1000)
      fail('sandbox is full. Reset the course to start fresh.');
  } catch (error) {
    // Commands are atomic: a failed multi-path operation never leaves partial changes.
    result.machine = machine;
    result.success = false;
    result.paths = [];
    result.output = error instanceof Error ? error.message : 'Something went wrong. Try help.';
  }
  return result;
}
