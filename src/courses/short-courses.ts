export type Lesson = {
  id: string;
  title: string;
  meaning: string;
  explanation: string;
  objective: string;
  example: string;
  hint: string;
};
export type ShortCourse = {
  id: string;
  title: string;
  duration: string;
  description: string;
  lessons: Lesson[];
  sources: { title: string; url: string }[];
};

export const shortCourses: ShortCourse[] = [
  {
    id: 'git-fundamentals',
    title: 'Git Fundamentals',
    duration: '15–20 minutes',
    description:
      'See how edits become snapshots, then make a change on your own branch. Four lessons in a simulated local repository.',
    sources: [
      { title: 'Git status', url: 'https://git-scm.com/docs/git-status' },
      { title: 'Git add', url: 'https://git-scm.com/docs/git-add' },
      { title: 'Git commit', url: 'https://git-scm.com/docs/git-commit' },
      { title: 'Git switch', url: 'https://git-scm.com/docs/git-switch' },
    ],
    lessons: [
      {
        id: 'inspect',
        title: 'Read the working tree',
        meaning: 'git status · What has changed?',
        explanation:
          'Your working tree contains the files you can edit. Git’s latest commit is a saved snapshot. The README below has an edit that is not saved in a commit yet. git status compares these states and reports what is staged or unstaged.',
        objective: 'Run git status and find the unstaged README.md change.',
        example:
          '$ git status\nOn branch main\nChanges not staged for commit:\n  modified: README.md',
        hint: 'Type git status. “Not staged” means the edit has not been selected for the next commit.',
      },
      {
        id: 'stage',
        title: 'Choose the next snapshot',
        meaning: 'git add · Select file content for a commit',
        explanation:
          'The staging area holds the exact content you choose for the next commit. git add README.md stages the file as it is now. Editing it again afterward changes the working file, but does not update that staged copy. git diff --cached shows the staged change.',
        objective: 'Stage the edited README.md, then inspect it with git diff --cached.',
        example:
          '$ git add README.md\n$ git diff --cached\n--- a/README.md\n+++ b/README.md\n... the selected change ...',
        hint: 'Run git add README.md, then git diff --cached. Try editing the file after staging to see why the two copies matter.',
      },
      {
        id: 'commit',
        title: 'Save a commit',
        meaning: 'git commit · Record the staged snapshot',
        explanation:
          'A commit records staged content with a message and a link to its parent commit. This lesson starts with the README already staged. Committing is local; it does not upload anything to GitHub. git log --oneline lets you inspect the history.',
        objective: 'Commit the staged README with a useful message, then inspect the history.',
        example:
          '$ git commit -m "Welcome new learners"\n[main c0ffee1] Welcome new learners\n$ git log --oneline',
        hint: 'Use git commit -m followed by a quoted message. Then run git log --oneline to complete the lesson.',
      },
      {
        id: 'branch',
        title: 'Give your change a branch',
        meaning: 'git switch -c · Start a branch at the current commit',
        explanation:
          'A branch is a movable name pointing to a commit. A new branch starts at the current commit; a new commit moves only that branch. This fresh demo starts clean on main. Create a branch, edit the README, stage it, and commit. Switching back to main will show its original snapshot.',
        objective:
          'Create feature/welcome, edit README.md, stage it, and commit on that branch. Keep main at its original commit.',
        example:
          '$ git switch -c feature/welcome\n# Edit README.md using the editor below\n$ git add README.md\n$ git commit -m "Add a welcome"\n$ git branch',
        hint: 'Create the branch before committing. Use the editor to change the README, then add and commit it. git branch shows the selected branch with *.',
      },
    ],
  },
  {
    id: 'ai-fundamentals',
    title: 'AI Fundamentals',
    duration: '15–20 minutes',
    description:
      'Understand models, build a clearer prompt, follow an agent’s tool loop, and compare local, on-premises, and cloud setups. Prepared examples; no live AI or API key.',
    sources: [
      {
        title: 'Building effective agents · Anthropic',
        url: 'https://www.anthropic.com/research/building-effective-agents',
      },
      { title: 'Local inference and hardware · Ollama FAQ', url: 'https://docs.ollama.com/faq' },
    ],
    lessons: [
      {
        id: 'model',
        title: 'Model, application, or agent?',
        meaning: 'Separate the model from the program around it',
        explanation:
          'A model turns supplied input into generated output. A chat application supplies an interface and manages messages around a model. An agent adds a program that can let the model choose tools and use their results in another step. The program manages permissions, limits, and stopping. Not every useful AI application needs an agent.',
        objective: 'Match the three descriptions to model, application, and agent.',
        example:
          'Model: generates text from supplied input.\nApplication: a chat screen stores and sends the conversation.\nAgent: a program lets a model request a tool, reads its result, and continues.',
        hint: 'Look at the behavior: generating, providing the interface, or choosing and using tools.',
      },
      {
        id: 'prompt',
        title: 'Build a grounded prompt',
        meaning: 'Goal + relevant context + boundaries + output format',
        explanation:
          'A useful prompt explains the task, supplies relevant evidence, and states constraints. We’ll build a handover prompt from a supplied incident note. This exercise assembles text; it does not send it to a model or judge whether generated answers would be correct. Always compare an answer with the evidence you provided.',
        objective:
          'Include the incident note, require uncertainty to be stated, and choose a three-bullet handover format. Then build your prompt.',
        example:
          'Summarise this incident for the next engineer.\nEvidence: checkout returned HTTP 503 from 09:12 to 09:18. Recovery was observed after a rollback. Root cause is not confirmed.\nUse only that evidence. State uncertainty.\nReturn three bullets: impact, observed recovery, unknowns.',
        hint: 'The incident note is relevant context. A request to sound confident cannot replace missing evidence.',
      },
      {
        id: 'agent',
        title: 'Follow the tool loop',
        meaning: 'Goal → tool request → result → next step',
        explanation:
          'The model does not itself become a server or a shell. An agent program passes context to the model and executes permitted tool requests. Tool results become input for the next step. A real setup also needs stop conditions, budgets, and observability. Here, you control a prepared read-only investigation; no commands reach a real service.',
        objective:
          'Allow the log-reading tool, inspect its result, and finish with an evidence-based report instead of an unapproved restart.',
        example:
          'Task: investigate checkout errors.\nTool request: read_logs("checkout")\nResult: HTTP 503; upstream connection refused.\nNext: report the observation and ask before making changes.',
        hint: 'Reading a log is different from changing a service. The observed connection error does not establish the full root cause.',
      },
      {
        id: 'hosting',
        title: 'Where does the AI live?',
        meaning: 'Place the model, agent program, and data separately',
        explanation:
          'Local inference runs on your own machine. On-premises inference runs on infrastructure your organisation operates. A cloud API uses a provider’s hosted model. The agent program can run somewhere different from the model, so local software can still send data to a cloud API. Hardware, model capability, data rules, access controls, and operating effort all matter.',
        objective:
          'Choose a suitable starting architecture for each scenario, using the stated assumptions.',
        example:
          'Offline laptop + a model that fits → local inference.\nOrganisation-operated GPU service + approved internal data → on-premises inference.\nOnline prototype + approved non-sensitive input + no model hardware → cloud API.',
        hint: '“Local app” does not automatically mean local inference. Neither on-premises nor cloud hosting alone guarantees security or privacy.',
      },
    ],
  },
];

export const findShortCourse = (id: string) => shortCourses.find((course) => course.id === id);
