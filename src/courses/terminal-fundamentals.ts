import { createMachine, HOME, type Machine } from '../engine/filesystem';
import type { CommandResult } from '../engine/commands';

export const COURSE_ID = 'terminal-fundamentals';
const PROJECTS = `${HOME}/projects`;
const PROJECT = `${PROJECTS}/my-first-project`;
export type Mission = {
  id: string;
  title: string;
  objective: string;
  command: string;
  meaning: string;
  explanation: string;
  walkthrough: { command: string; explanation: string }[];
  task: string;
  hint: string;
  solution: string[];
  completion: string;
  startingState: () => Machine;
  prepare: (machine: Machine) => Machine;
  validate: (result: CommandResult) => boolean;
};

function exampleAt(cwd: string, note = false) {
  return (machine: Machine): Machine => ({
    ...machine,
    cwd,
    previous: machine.cwd,
    nodes: {
      ...machine.nodes,
      ...(cwd.startsWith(PROJECTS) ? { [PROJECTS]: { kind: 'directory' as const } } : {}),
      ...(cwd === PROJECT ? { [PROJECT]: { kind: 'directory' as const } } : {}),
      ...(note
        ? {
            // Standalone examples include the file from the previous mission.
            [`${PROJECT}/README.md`]: machine.nodes[`${PROJECT}/README.md`] ?? {
              kind: 'file' as const,
              content: '',
            },
            [`${PROJECT}/notes.txt`]: machine.nodes[`${PROJECT}/notes.txt`] ?? {
              kind: 'file' as const,
              content:
                'You built this workspace, one command at a time.\nKeep experimenting. Every expert started here.\nBuild. Learn. Repeat.\n',
            },
          }
        : {}),
    },
  });
}
// Example fixtures are separate from live transitions: only the learner changes cwd.
const keepWorkspace = (machine: Machine) => machine;
const addReadingNote = (machine: Machine): Machine => ({
  ...machine,
  nodes: {
    ...machine.nodes,
    [`${PROJECT}/notes.txt`]: machine.nodes[`${PROJECT}/notes.txt`] ?? {
      kind: 'file',
      content:
        'You built this workspace, one command at a time.\nKeep experimenting. Every expert started here.\nBuild. Learn. Repeat.\n',
    },
  },
});

export const LAUNCHPAD = `${PROJECTS}/launchpad`;
const definitions: (Omit<Mission, 'startingState'> & {
  exampleCwd: string;
  exampleNote?: boolean;
  exampleProject?: boolean;
})[] = [
  {
    id: 'where-am-i',
    title: 'Where Am I?',
    objective: 'Understand your current working directory.',
    command: 'pwd',
    meaning: 'Print working directory',
    explanation:
      'Your working directory is the folder you’re currently in. pwd prints its address, called a path. It shows where you are without moving you or changing any files.',
    walkthrough: [
      {
        command: 'pwd',
        explanation:
          'The answer is /home/learner: your current directory. The slashes separate folders, like an address leading from home to learner.',
      },
    ],
    task: 'Find out which directory you’re in. Ask the terminal to display your current location.',
    hint: 'Type pwd and press Enter. The path it prints is your location — you don’t need to type that path yourself.',
    solution: ['pwd'],
    completion:
      'pwd prints your working directory. A path is an address: /home/learner tells you exactly where you are.',
    prepare: keepWorkspace,
    exampleCwd: HOME,
    validate: (r) => r.success && r.command === 'pwd',
  },
  {
    id: 'whats-here',
    title: 'What’s Here?',
    objective: 'Discover files and directories.',
    command: 'ls',
    meaning: 'List directory contents',
    explanation:
      'ls shows the files and folders inside your current directory. In this lab, a / after a name marks a directory; a name without it is a file.',
    walkthrough: [
      {
        command: 'ls',
        explanation:
          'projects/ is a directory; welcome.txt is a file. Listing lets you look around without opening or changing anything.',
      },
    ],
    task: 'List the contents of your current directory. Look for the projects folder.',
    hint: 'Type ls and press Enter. The names it prints are the things inside your current directory.',
    solution: ['ls'],
    completion:
      'ls lists directory contents. Names ending in / are directories in this simulator. Try ls -a to see hidden files, too.',
    prepare: keepWorkspace,
    exampleCwd: HOME,
    validate: (r) => r.success && r.command === 'ls' && r.paths.includes(r.machine.cwd),
  },
  {
    id: 'moving-around',
    title: 'Moving Around',
    objective: 'Navigate between directories.',
    command: 'cd',
    meaning: 'Change directory',
    explanation:
      'cd followed by a folder name moves you into it. For example, cd projects opens the projects directory. Use pwd afterward to see your new location.',
    walkthrough: [
      { command: 'pwd', explanation: 'We start in /home/learner. First, check where you are.' },
      {
        command: 'ls',
        explanation: 'The projects/ directory is here, so we can move into it by name.',
      },
      {
        command: 'cd projects',
        explanation:
          'cd changes your directory without printing a message. Notice that the prompt now ends in /projects.',
      },
      {
        command: 'pwd',
        explanation:
          'The new path is /home/learner/projects. We moved into the folder; the files themselves have not moved.',
      },
    ],
    task: 'Move into the projects directory inside your home folder.',
    hint: 'Use the command for “change directory”, followed by the folder name.',
    solution: ['cd projects'],
    completion:
      'cd changes your working directory. cd .. takes you up one level, and cd ~ returns you home.',
    prepare: keepWorkspace,
    exampleCwd: HOME,
    validate: (r) => r.success && r.machine.cwd === PROJECTS,
  },
  {
    id: 'create-something',
    title: 'Create Something',
    objective: 'Create your own directory.',
    command: 'mkdir',
    meaning: 'Make a directory',
    explanation:
      'mkdir followed by a name creates a folder in your current directory. It usually succeeds quietly. Use ls afterward to check that your new folder exists.',
    walkthrough: [
      {
        command: 'mkdir my-first-project',
        explanation:
          'The new directory is created. No output is normal here: the terminal is ready for another command.',
      },
      {
        command: 'ls',
        explanation:
          'my-first-project/ now appears in the list. That is how you can check your work.',
      },
    ],
    task: 'Create a directory named my-first-project inside projects.',
    hint: 'The command combines “make” and “directory”. Give it the name of your new folder.',
    solution: ['mkdir my-first-project'],
    completion:
      'mkdir creates directories. We checked that your folder exists, so an absolute path or mkdir -p works just as well.',
    prepare: keepWorkspace,
    exampleCwd: PROJECTS,
    validate: (r) => r.success && r.machine.nodes[PROJECT]?.kind === 'directory',
  },
  {
    id: 'your-first-file',
    title: 'Your First File',
    objective: 'Create a file inside your project.',
    command: 'touch',
    meaning: 'Create an empty file',
    explanation:
      'Move into my-first-project with cd before creating its README. touch followed by a filename creates an empty file. A README introduces a project; we’ll create it now and leave editing for later.',
    walkthrough: [
      {
        command: 'cd my-first-project',
        explanation:
          'We are still in projects after making the folder. cd moves us inside it; mkdir did not move us.',
      },
      {
        command: 'pwd',
        explanation: 'Check that we are inside my-first-project before creating a file.',
      },
      {
        command: 'touch README.md',
        explanation: 'touch creates the empty file. It succeeds quietly, just like mkdir.',
      },
      {
        command: 'ls',
        explanation:
          'README.md is now listed in our project. Creating a file does not automatically put text inside it.',
      },
    ],
    task: 'Create a file named README.md inside my-first-project.',
    hint: 'Use pwd to check where you are. From projects, cd my-first-project moves into your folder; touch then creates an empty file there.',
    solution: ['cd my-first-project', 'touch README.md'],
    completion:
      'touch creates an empty file without changing existing content. README.md is now part of your project. Editing comes in a future course.',
    prepare: keepWorkspace,
    exampleCwd: PROJECTS,
    exampleProject: true,
    validate: (r) => r.success && r.machine.nodes[`${PROJECT}/README.md`]?.kind === 'file',
  },
  {
    id: 'read-a-file',
    title: 'Read a File',
    objective: 'Inspect a text file’s contents.',
    command: 'cat',
    meaning: 'Display a file’s contents',
    explanation:
      'cat followed by a filename prints the text inside it. We’ve added notes.txt to your project for this mission. Use ls to find it, then cat to read it.',
    walkthrough: [
      {
        command: 'ls',
        explanation:
          'Here is notes.txt. Listing shows the name; it does not show what is written inside.',
      },
      {
        command: 'cat notes.txt',
        explanation:
          'Now we can read the file’s contents. cat displays the text without changing it.',
      },
    ],
    task: 'Display the contents of notes.txt in your project directory.',
    hint: 'The cat command prints a file’s contents. Follow it with a filename or a path.',
    solution: ['cat notes.txt'],
    completion:
      'cat prints file contents. You can now find your way around, create directories and files, and read what’s inside. That’s a real foundation.',
    prepare: addReadingNote,
    exampleCwd: PROJECT,
    exampleNote: true,
    validate: (r) => r.success && r.command === 'cat' && r.paths.includes(`${PROJECT}/notes.txt`),
  },
  {
    id: 'build-your-launchpad',
    title: 'Build Your Launchpad',
    objective: 'Combine navigation, directories, files, and checking your work.',
    command: 'Your turn',
    meaning: 'A small project, built by you',
    explanation:
      'No new commands this time. Put what you’ve learned together. Start by checking where you are, and choose your own route. Hints and a worked example are here if you need them.',
    task: 'Inside projects, create a new directory called launchpad. Add an empty README.md inside it, move into launchpad, and print its full location to check your work.',
    hint: 'Think in small steps: find projects, make a directory, move inside it, create a file, and check your location. You already know a command for each step. Use ls to check the file too.',
    solution: ['cd ~/projects', 'mkdir launchpad', 'cd launchpad', 'touch README.md', 'pwd'],
    walkthrough: [
      {
        command: 'pwd',
        explanation:
          'We finish the reading mission inside my-first-project. Checking first tells us where to begin.',
      },
      {
        command: 'cd ~/projects',
        explanation:
          'This path returns to projects from wherever we happen to be. The ~ stands for our home directory.',
      },
      {
        command: 'mkdir launchpad',
        explanation:
          'Create a new project directory. We are still in projects until we change directory ourselves.',
      },
      {
        command: 'cd launchpad',
        explanation:
          'Move inside the new directory. Relative names are resolved from the folder we are currently in.',
      },
      {
        command: 'touch README.md',
        explanation:
          'Create an empty README inside launchpad. A file in a different folder would not meet this objective.',
      },
      {
        command: 'ls',
        explanation:
          'README.md appears in this directory. Listing is a useful way to check that the file exists.',
      },
      {
        command: 'pwd',
        explanation:
          'The full path ends in /projects/launchpad. The directory, file, and final location now match our objective.',
      },
    ],
    completion:
      'You built a project from a goal, using the commands you learned. You checked both what you created and where you were. That’s a habit you can take into a real terminal.',
    prepare: keepWorkspace,
    exampleCwd: PROJECT,
    exampleNote: true,
    validate: (r) =>
      r.success &&
      r.command === 'pwd' &&
      r.machine.cwd === LAUNCHPAD &&
      r.machine.nodes[LAUNCHPAD]?.kind === 'directory' &&
      r.machine.nodes[`${LAUNCHPAD}/README.md`]?.kind === 'file',
  },
];
export const missions: Mission[] = definitions.map(
  ({ exampleCwd, exampleNote, exampleProject, ...mission }) => ({
    ...mission,
    startingState: () => {
      let machine = exampleAt(exampleCwd, exampleNote)(createMachine());
      // The file mission starts where the learner left off: in projects, outside the new folder.
      if (exampleProject)
        machine = { ...machine, nodes: { ...machine.nodes, [PROJECT]: { kind: 'directory' } } };
      return machine;
    },
  }),
);

export const learningPath = [
  ['Terminal Fundamentals', 'Your first conversation with a computer.'],
  ['Git Fundamentals', 'Track changes. Build with others.'],
  ['Linux Fundamentals', 'Get to know the system underneath.'],
  ['Networking Fundamentals', 'Understand how everything connects.'],
  ['Docker Fundamentals', 'Give your applications a portable home.'],
  ['Kubernetes Fundamentals', 'Bring your containers together.'],
  ['GitOps with Argo CD', 'Let Git describe your homelab.'],
  ['DevSecOps Fundamentals', 'Build security into every step.'],
];
