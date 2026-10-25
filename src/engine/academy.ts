import { courses } from '../courses/catalogue';
import { findShortCourse } from '../courses/short-courses';
import { createTerminalMemory } from '../components/terminal-memory';
import { execute } from './commands';
import { HOME, directory, type Machine } from './filesystem';
import { parseCommand } from './parser';

export const ACADEMY = `${HOME}/academy`;
export const academyCommands = ['ls', 'cd', 'pwd', 'cat', 'clear', 'help'];
export type AcademyEntry = {
  command: string;
  path: string;
  output: string;
  success: boolean;
  listing: boolean;
};
export function createAcademyMachine(): Machine {
  const nodes: Machine['nodes'] = {
    '/': directory(),
    '/home': directory(),
    [HOME]: directory(),
    [ACADEMY]: directory(),
  };
  for (const course of courses) {
    const path = `${ACADEMY}/${course.id}`;
    const curriculum = findShortCourse(course.id);
    nodes[path] = directory();
    nodes[`${path}/README.md`] = {
      kind: 'file',
      content: `${course.title}\n${course.description}\nTopics: ${course.topics}\nStatus: ${course.status === 'planned' ? 'Planned — lessons are not available yet.' : course.id === 'terminal-fundamentals' ? 'Completed introduction — available for practice.' : 'Available — four interactive introductory lessons.'}\n${curriculum?.description ?? ''}\n${course.status === 'available' ? 'Use the Start course button to enter the learning workspace. cd only changes your directory.' : 'You can explore this description now; there is no launch action until lessons are ready.'}\n`,
    };
    if (curriculum) {
      nodes[`${path}/lessons`] = directory();
      curriculum.lessons.forEach((lesson, i) => {
        nodes[`${path}/lessons/${String(i + 1).padStart(2, '0')}-${lesson.id}.md`] = {
          kind: 'file',
          content: `${lesson.title}\n${lesson.meaning}\n\n${lesson.explanation}\n\nObjective: ${lesson.objective}\n\nExample:\n${lesson.example}\n`,
        };
      });
    }
  }
  return { cwd: ACADEMY, previous: ACADEMY, nodes };
}
export function runAcademy(machine: Machine, line: string) {
  const failed = (output: string) => ({
    machine,
    output,
    success: false,
    clear: false,
    listing: false,
  });
  let args: string[];
  try {
    args = parseCommand(line);
  } catch (error) {
    return failed((error as Error).message);
  }
  if (!args.length) return { machine, output: '', success: true, clear: false, listing: false };
  if (!academyCommands.includes(args[0]))
    return failed(
      `This course browser supports ${academyCommands.join(', ')}. Type help for examples.`,
    );
  if (args[0] === 'help')
    return {
      machine,
      success: true,
      clear: false,
      listing: false,
      output:
        'ls: list contents\ncd <directory>: move into a directory; cd .. goes up; cd - goes back\npwd: print your location\ncat README.md: read a course description\nclear: clear this transcript\nClick Start course when you are ready. This is an Academy learning simulator, not a host shell.',
    };
  const result = execute(machine, line);
  const listing =
    result.success &&
    result.command === 'ls' &&
    result.paths.length === 1 &&
    result.paths[0] === ACADEMY;
  return {
    machine: result.machine,
    success: result.success,
    clear: !!result.clear,
    listing,
    output: listing
      ? courses
          .map(
            (course) =>
              `${course.id}/  ${course.status === 'planned' ? 'Planned' : course.id === 'terminal-fundamentals' ? 'Completed' : 'Available'}  ${course.description}`,
          )
          .join('\n')
      : result.output,
  };
}
export function createAcademySession() {
  return {
    welcome: true,
    machine: createAcademyMachine(),
    entries: [] as AcademyEntry[],
    terminal: createTerminalMemory(),
  };
}
export type AcademySession = ReturnType<typeof createAcademySession>;
