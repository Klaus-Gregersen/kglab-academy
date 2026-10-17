# MVP verification — 16 October 2026

The repository was empty before implementation. No existing application conventions or deployment files were present. The separate Academy checkout was created under `PrivateHomelab/kglab-academy`; sibling infrastructure projects were not modified.

Validation completed locally:

- `pnpm test`: **47 tests passed**. Coverage includes tokenization, quoting, unsupported shell operators, filesystem paths, navigation, creation, failed-operation rollback, all six mission validators, course unlocking, progress persistence, and malformed/unavailable/oversized storage.
- `pnpm test:e2e`: **4 tests passed** across desktop Chromium and Pixel 7 emulation. Both projects complete the entire course with alternate valid paths, refresh between missions, check 100% completion, test reset cancellation and confirmation, verify modal keyboard focus and Escape, and check command history and filesystem persistence. No JavaScript page errors were reported during the full-course flow.
- `pnpm build`: passed strict TypeScript checking and generated static assets in `dist/`. Terminal rendering is loaded as a separate chunk; the build has no oversized-chunk warning.
- `pnpm format:check`: passed.
- Manual in-app-browser checks covered the landing page, terminal input/output, mission success, and responsive layouts. The captured first-mission result is in `academy-preview.jpg`.
- The local dev server returned HTTP 200.

Limitations: Docker was installed but its daemon was not running, so the Docker image was **not built or smoke-tested**. Browser automation used Chromium with a mobile viewport, not a physical phone, Safari, or a full screen-reader audit. The static app was built and tested locally; it was not published, pushed to GitHub, or deployed into Kubernetes.

## Terminal usability iteration

The command input now has a visible label, highlighted border, and Run button. Clicking output focuses the input without interfering with text selection. Tab completes command names and paths from the live virtual filesystem; a Complete button provides the same function on touch devices. Several matches show selectable suggestions. Plain Tab retains focus on empty input and on repeated no-match attempts, preserving typed text. Empty input offers command names. Escape then Tab and Shift+Tab provide explicit ways out of the input. Completion does not execute commands or complete missions.

Practical coaching introduces completion, history, navigation shortcuts, quoted names, and display/input clearing. Relevant actions can introduce a tip once in the mounted terminal session; learners can also request another tip.

- Unit suite: **65 tests passed**, including 18 completion cases for common prefixes, current-directory state, absolute/home/parent/hidden paths, spaces, quotes, literal shell characters, mid-command editing, and non-execution.
- Browser suite: **8 tests passed** across desktop Chromium and mobile emulation, including visible entry, output-click focus, ambiguous suggestions, live learner-created names, touch completion, mission validation only on execution, and keyboard exit.
- Strict TypeScript and static production build passed. README and terminal help describe the shortcuts.
- `terminal-completion.jpg` shows the updated input and coaching in the actual browser. The learner’s saved course progress was preserved during visual verification.

## Guidance controls and idle nudges

The title bar now has a settings wheel for learning hints, idle nudges, hint animation, shortcut reminders, and a 45/90/120-second quiet period. Preferences persist separately from course progress. Hint icons play a short wiggle twice when first visible, or when a new tip/idle offer becomes available; reduced motion suppresses animation.

An unfinished mission can offer help once after an inactive period. Workspace interaction resets the timer; hidden/unfocused pages pause it. Completion and revealed hints disable the offer. It never reveals a hint or solution automatically, changes progress, starts a countdown, or sends activity data anywhere.

- **73 unit tests passed**, including defaults, saved preferences, invalid versions/types/delays, and unavailable storage.
- **16 browser tests passed** across desktop Chromium and mobile emulation. New cases cover settings persistence and shared behavior, toggles, Escape/focus restoration, configurable delays, interaction resets, one offer per mission, explicit hint requests, completion suppression, and reduced motion. Page-visibility lifecycle events are simulated explicitly because headless Chromium does not model OS tab switching faithfully.
- Strict TypeScript and the production build passed. Settings layout was also inspected in the in-app browser without resetting the learner’s progress or changing their chosen preferences.
- `guidance-settings.jpg` captures the settings panel. The initial Docker, physical-device, and full screen-reader verification limitations still apply.

## Watch first, then practice

Every mission now introduces its command and meaning before the objective. The objective itself opens an optional walkthrough that types commands, shows actual simulated results, and explains the whole mission, including confirmation commands. All six demonstrations run from independent fixtures using the command engine. They do not call practice execution, persistence, history, or progress updates. The final demo also includes the README from the preceding lesson while preserving an existing README in practice.

Pause/resume, replay, a readable transcript, and returning to practice are available. Reduced motion shows a static completed example and opens the transcript. Idle nudges pause while a walkthrough is open. Practical terminal tips now start collapsed and never expand automatically in response to activity, keeping the objective and input dominant.

- **82 unit tests passed**: all six walkthroughs execute successfully and fulfill their mission validators; navigation and creation results match actual command behavior; playback reaches a stable final frame; standalone fixtures remain independent.
- **22 browser tests passed** across desktop Chromium and mobile emulation. New checks cover introduced command meanings, pause/resume/replay, unchanged practice filesystem/draft/history/progress, idle suppression while watching, modal focus and Escape, readable reduced-motion examples, collapsed tips, and watching a multi-step navigation mission before completing it in practice.
- Strict TypeScript and the static production build passed. `mission-walkthrough.jpg` captures the live example, with the learner's original course progress preserved. The prior Docker, physical-device, and full screen-reader verification limitations remain.

## Community shelf and continuous practice

- Added `MANIFESTO.md` and updated the public philosophy to recommend useful free learning beyond KG LAB, credit creators, and invite Git-based resource recommendations.
- Added `/#community`: eight editorial starter resources, seven categories, combined search/filtering, favorites, empty states, access/setup notes, and contribution instructions. Original sources were checked on 2026-10-16, including the current WebGoat repository and Docker tutorial destination. Favorites are explicitly device-local; shared voting is planned, with no invented public counts or rankings.
- Completed missions open isolated review demonstrations. Switching to Community and back retains the current mission, files, draft, history, and session output. Mission transitions preserve `cwd` and `previous`; the learner navigates into their own project. Adding the reading fixture preserves an existing notes file.
- Added the independent Build Your Launchpad mission and a live outcome checklist. Completion requires the directory, its README, and a successful location check from inside it. Six-mission saves remain valid and expose the appended challenge. The existing preview save was visibly retained at 6/7.
- `pnpm test`: **94 unit tests passed**, covering the complete seven-mission journey, example fixtures, final challenge validation, save compatibility, directory preservation, combined resource filters, favorites persistence, corruption, and blocked storage.
- `pnpm test:e2e`: **28 desktop/mobile browser tests passed**. New checks cover discovery, categories/search, saving/removing favorites, refresh persistence, empty states, contribution instructions, blocked storage, browser Back navigation, completed-mission replay, and retained history/output/drafts. The full course, settings, nudges, reduced motion, reset, and existing completion behavior also pass.
- Production build and formatting checks pass. `community-shelf.jpg` records a visual review of the new page in the local preview. The beginner observation guide is in `usability-check.md`; no human usability study is claimed.
- Changes remain local. No application publication, repository push, shared voting service, or production infrastructure change was performed.

## Shared community upvotes

- Replaced the primary card action with an upvote arrow, confirmed shared count, pressed state, and undo. Personal bookmarks remain as **Save for later**, with their existing storage retained; no bookmark was automatically turned into a public vote.
- **Most upvoted** is the default ordering, applied within search/category/favorite results. **A–Z** remains available; tied counts preserve catalogue order. New resources still use Git-based review.
- Added a Node 24 service with SQLite persistence, signed anonymous voter cookies, a unique resource/voter constraint, parameterized queries, explicit idempotent PUT state, same-origin/custom-header checks, limited JSON bodies, and a per-identity write limit. No account, external database service, or third-party runtime dependency was added. Clearing cookies can create another identity; these are per-browser votes, not verified individual people.
- Development serves the API through Vite. The production Node server serves built assets and the same API. The default Docker target now supports both, with a documented persistent volume; the optional `static` target has no API and honestly disables voting.
- **105 unit tests passed**. Added checks cover shared totals, repeat submission, independent undo, persisted identity/totals after reopening the database, forged cookies, origin/type/body validation, rate limiting, response schemas, and rankings.
- **34 desktop/mobile browser tests passed**. Separate browser contexts see the same counts, retain their own vote after reload, cannot add duplicate votes by resending, and undo independently. Other tests cover ranking, filtering, alphabetic order, bookmarks, unavailable counts, rejected writes, and recovery. The suite runs on port 5174 with an isolated in-memory database and does not alter preview votes.
- `pnpm test:server` passed the built Node HTTP server check: actual assets and headers, missing/private data paths, malformed and oversized bodies, and shared totals/cookies after a process-server restart using the same temporary database.
- Production build and formatting checks pass. Browser-tool inspection of the current app tab was blocked by its URL policy; automated HTTP desktop/mobile checks provide the UI verification for this iteration. No fresh manual screenshot is claimed; `community-shelf.jpg` shows the preceding bookmark-only iteration.
- Deployment instructions cover public origin, secure cookies, a single app instance, durable storage, and backups. The Docker image itself remains untested without a running daemon. No changes were deployed to existing infrastructure.

## Learner-recommended Git and Kubernetes practice

- Added Learn Git Branching in **Git**, linking to the browser-based visual tutorial and its original source repository. Added Killercoda Kubernetes in **Kubernetes**, linking directly to its scenarios/playground collection.
- Checked the original project README, Killercoda student page, FAQ, and pricing on 2026-10-16. The Killercoda entry distinguishes free scenarios (registration and one-hour sessions) from paid longer sessions and separate courses. Learn Git Branching is described as a free browser simulator requiring JavaScript, without a local Git installation or account.
- The catalogue now contains ten resources. Existing entries keep their stable IDs and vote associations; the preview API recognizes both new IDs with zero initial votes. Updated README documentation and removed fixed eight-entry assumptions from the existing community browser checks.
- Validation: **105 unit tests passed**, production build passed, and **12 focused desktop/mobile community and voting checks passed**. No new dependencies or infrastructure changes.

## Public-release hardening and repository controls

- Added connection/global traffic budgets, persistent identity/write quotas, IPv6 /64 grouping, explicit proxy trust, bounded vote/quota storage, cached totals, and request/connection limits. Cookie resets do not reset the connection budgets; distributed anonymous abuse remains possible.
- Production startup requires an HTTPS public origin. Host validation, Secure cookies, HSTS, Permissions-Policy, dotfile/private-file rejection, realpath/symlink boundaries, and a constrained container template are implemented. Node/nginx images and GitHub Actions are pinned to digests/commits resolved from their original registries/repositories.
- Added ignore rules and a staged-content secret guard with a configured local hook. Tests prove that cleaning a working file does not hide a secret already staged in the index, and that private filenames are blocked without printing their contents.
- Prepared read-only GitHub-hosted CI, dependency updates, CODEOWNERS routing, and a post-bootstrap main policy requiring pull requests and the Academy checks status. These source changes are not yet pushed; GitHub CI and the required-check policy have not run/been activated.
- Applied and verified GitHub ruleset **25267613**, blocking deletion and force pushes to main. Secret scanning/push protection remain enabled. Enabled Dependabot security updates, private vulnerability reporting, read-only workflow defaults, disabled Actions PR approvals, and approval for all external contributors' fork workflows.
- Production HTTP checks pass for restart persistence, oversized/malformed bodies, private paths, symlinks, Host validation, security headers, and fail-closed startup. **34 desktop/mobile checks pass**. An initial animation check was rerun after source/config reloads finished; the final unchanged-input suite passed.
- Final local verification: **114 unit tests, 3 production HTTP checks, and 34 desktop/mobile browser checks passed**. Strict TypeScript checking, the production build, and formatting passed. The candidate-file secret guard checked 89 files without matches; the staged guard checked zero files because no application source is staged yet.
- Docker Compose configuration validates without starting anything. The image itself has not been built/scanned locally; CI now includes image build and constrained-container startup checks for when the source is intentionally pushed. Real HTTPS/proxy/network boundaries, edge protections, disk quotas, backup/restore, and image scanning remain deployment requirements in `public-hosting.md`.
- No application source was pushed and no production infrastructure was deployed or modified. Repository security settings and the local hook were changed within the authorized hardening scope.
