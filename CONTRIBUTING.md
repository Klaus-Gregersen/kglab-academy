# Help make the lab better

Good questions and small corrections belong here. Keep explanations welcoming to complete beginners and make every mission testable. Don't imply planned courses are available.

1. Fork this repository if you don't have write access.
2. Clone your fork, install dependencies using the README, and create a branch: `git switch -c improve-terminal-lesson`.
3. Edit a lesson in `src/courses/terminal-fundamentals.ts`, or make a focused code change.
4. Run `pnpm security:check`, `pnpm test`, and `pnpm build`. For interface changes, also run `pnpm test:e2e` and check desktop/mobile layouts. For voting or server changes, run `pnpm test:server` after building; tests use temporary/in-memory databases, not preview or production votes.
5. Review `git diff`, then stage only your intended files with `git add <files>`.
6. Commit with a clear message, push your branch, and open a pull request describing the problem, change, and validation.

Keep the terminal simulated. Never add arbitrary command execution or connect to a real cluster. Infrastructure deployment needs its own explicit review. Avoid adding dependencies or collecting learner data unless a concrete requirement justifies it.

Guided contribution lessons will be introduced with Git Fundamentals. Until then, this is a normal Git-based contribution workflow, not an integrated in-app feature.

## Recommend a free learning resource

Good teaching does not have to live here. Recommend a repository, course, book, guide, or practice lab by editing `src/community/resources.ts` through the branch/commit/pull request workflow above. Add a unique stable ID, title, publisher, existing category (or extend the category list), format, level, brief learning value, access requirements, original HTTPS link, and optional separate repository link.

In your pull request, explain:

- Who the resource helps and which lesson/topic it complements.
- What you tried or read, and why it helped. Don't claim experience you haven't had.
- Whether the linked learning material is free, and any registration, optional paid extras, local setup, software licensing, or safety requirements. Avoid affiliate/referral links.
- The date you checked that the original source is active and the linked material is accessible.

Maintainers review learning value, accessibility, attribution, and access claims. Check existing entries to avoid duplicates; report dead links or changed paywalls through a focused documentation/code PR. We link to original material rather than copying someone else's course. Keep resource IDs stable: they associate both personal bookmarks and shared votes with the resource. Old vote rows for removed IDs are retained in storage but excluded from the public snapshot.

The starter collection is editorial. **Upvote** changes a shared, server-confirmed count and influences ranking; **Save for later** remains a device-local bookmark. No bookmark is converted into a public vote. Votes help maintainers assess useful links, while new resources still need a review. Do not seed invented counts or claim endorsements. Anonymous voting is per browser identity, not verified people; stronger abuse controls can be added if actual usage requires them.

## Check the beginner experience

Use [the short observation guide](docs/usability-check.md) with a willing beginner. Record anonymous observations and concrete friction, not personal details or a claim of successful research without a session. Keep any changes focused on helping the next learner understand and act.

Build. Learn. Repeat.

See [repository security](docs/repository-security.md) for push protection, local hooks, CI, and the protected-main policy. Pull requests do not automatically deploy code or grant contributors access to the homelab.
