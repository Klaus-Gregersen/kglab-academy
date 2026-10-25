# Git and AI introductory courses

These are two small, fully interactive beginner courses available after the terminal introduction. Each has four lessons, independent browser-local completion, worked examples, optional hints, repeatable exercises, and source links. They are introductions, not complete coverage of Git or AI engineering.

## Git Fundamentals

1. **Read the working tree** — use `git status` to distinguish an unstaged edit from the latest commit.
2. **Choose the next snapshot** — stage README content with `git add README.md` and inspect `git diff --cached`. Editing after staging changes the working copy while preserving the selected snapshot.
3. **Save a commit** — commit the staged snapshot with a message, then inspect `git log --oneline`.
4. **Give your change a branch** — create `feature/welcome`, edit/stage/commit, and inspect the independent `main` snapshot.

Each lesson starts a fresh one-file demo repository so it can be attempted or revisited independently. The three visual areas represent working tree, staging area, and current HEAD. Commit IDs are deterministic demo identifiers, not actual Git object hashes. A branch points to a commit and its history follows parent links. Committing captures staged content and retains later unstaged edits. The simulator asks learners to commit before switching to a different existing branch; real Git permits some compatible uncommitted changes across branch switches, and the simulator's message explains this limit.

Supported commands are shown by `help`. There is no real Git process, remote repository, GitHub login, push, merge, credential, or server execution. Text editing is through the labelled README textarea. Unsupported commands fail without mutating the demo.

Reference material: [git status](https://git-scm.com/docs/git-status), [git add](https://git-scm.com/docs/git-add), [git commit](https://git-scm.com/docs/git-commit), and [git switch](https://git-scm.com/docs/git-switch).

## AI Fundamentals

1. **Model, application, or agent?** — match generation, user interface/conversation management, and model-directed tool use to their roles.
2. **Build a grounded prompt** — supply a goal and choose relevant incident evidence, an uncertainty boundary, and an explicit handover format. The learner reviews whether their own goal can be answered from the evidence.
3. **Follow the tool loop** — grant read-only log permission, inspect a prepared result, and choose an evidence-based report rather than an unapproved restart or unsupported root-cause claim.
4. **Where does the AI live?** — compare local, organisation-operated on-premises, and provider-hosted cloud inference under stated scenario assumptions.

The prompt builder assembles text. It does not generate an AI answer, score semantic prompt quality, or predict that a prompt will produce correct output. The agent exercise is a bounded, predefined illustration of a tool loop, not a live autonomous agent. All outputs and evidence are prepared learning fixtures. No prompt is sent to any external model, no AI API key is accepted, and the cluster hosts no model or agent worker for these activities.

The hosting exercise separates the model endpoint, agent program, and data location. It makes no throughput, hardware-price, model-fit, or privacy guarantees; actual deployment needs model/hardware sizing and an assessment of data policy, access controls, operations, and cost. “Local application” alone does not mean local inference.

Reference material: [Anthropic's architectural distinction between workflows and agents](https://www.anthropic.com/research/building-effective-agents) and [Ollama's local inference/hardware FAQ](https://docs.ollama.com/faq). These sources support concepts, not an endorsement of a particular provider or installation instructions.

## Architecture and progress

- `src/courses/short-courses.ts`: lesson content, examples, objectives, hints, and primary sources.
- `src/components/CourseWorkspace.tsx`: shared lesson navigation, reading panel, completion feedback, and sources.
- `src/components/GitLab.tsx` / `src/engine/git.ts`: interactive repository visualization and bounded Git model.
- `src/components/AILab.tsx`: prepared conceptual, prompt, permission, and hosting activities.
- `src/state/course-progress.ts`: independent progress keys `kglab:course:git-fundamentals:v1` and `kglab:course:ai-fundamentals:v1`.

Only validated lesson IDs, the selected lesson, and earned completion are persisted. Git repository edits, AI prompt text, activity choices, and command history are in-memory exercises; refreshing or revisiting an activity opens its fresh example. A saved “completed earlier” notice distinguishes earned progress from the new attempt. Restarting an activity preserves earned completion. This never changes terminal intro files/completion or relocks the Academy. Corrupt course progress resets only the affected course; storage failures are reported with a session-only notice.

All new UI/content ships in the existing Academy frontend and container. Hosting, namespace, storage, network policy, tunnel route, and the reviewed GitOps image-update process are reused. This implementation has not itself been deployed.
