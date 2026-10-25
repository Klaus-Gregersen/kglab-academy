# Academy course hub

Terminal Fundamentals is the introduction and the only completion gate for the Academy. Completing all seven missions unlocks the hub at `#academy`. Future courses do not introduce a chain of additional completion prerequisites.

## Learner journey

1. New learners arrive at the public homepage and start the terminal introduction.
2. Opening **Academy** before finishing shows a closed gate, the current mission count, and a start/continue button. Opening `#academy` directly follows the same rule. There is no skip-intro control.
3. Finishing the final mission leaves its output and feedback visible. **Unlock your academy** takes the learner into a large terminal course browser.
4. Initially the terminal shows a welcome and an invitation to type `ls`. Course directories appear after listing them. `cd` changes location; `ls` lists the selected directory; `cat README.md` reads its overview. `cd ..`, `cd -`, and absolute paths work normally. Entering a directory never launches a course automatically. Use its explicit **Start course** button when ready.
5. Returning to the root URL with completed progress opens the hub. **Revisit your terminal** starts independent practice at the first lesson; **Return to your course** restores the saved workspace. A direct `#workspace` load resumes the saved course position. See [mission practice](mission-practice.md). Explicit homepage links remain available.
6. Resetting the intro clears completion and closes the gate again. Partial progress never unlocks the hub.

The community shelf remains publicly accessible. The homepage previews the roadmap. Terminal Fundamentals, Git Fundamentals, and AI Fundamentals are available; six other courses remain labelled **Planned** and have no launch buttons. The two new courses each have four introductory lessons, documented in [introductory courses](introductory-courses.md).

The terminal browser is read-only, using a separate virtual filesystem at `~/academy`. It supports `ls`, `cd`, `pwd`, `cat`, `help`, and `clear`; it does not permit file mutation, shell operators, or host commands. Tab completion retains input focus even on no match. Shift+Tab or Escape followed by Tab exits the input. Clickable directory names perform navigation, and **Prefer clicking? Browse courses** lists the courses without requiring typing. Course metadata is identical in the typed and clickable paths. The terminal directory, transcript, history, and draft survive leaving for a course and returning within the current app session; refreshing starts a new browser-directory session.

## Implementation

- `src/courses/catalogue.ts` is the shared metadata for the homepage and hub. It includes the existing DevOps roadmap plus AI Fundamentals, whose proposed topics cover prompting, agents, and local/on-premises/cloud deployment choices.
- `src/components/AcademyPage.tsx` renders the closed gate or terminal hub from the validated terminal completion count.
- `src/components/AcademyTerminal.tsx` renders the large accessible terminal, directory listing, explicit course launch, and clickable fallback.
- `src/engine/academy.ts` creates the separate read-only filesystem, README files, lesson notes, and browser session.
- `src/components/CommandEntry.tsx` supplies command entry, completion, history, and keyboard escape for the course browser and Git lab.
- `src/App.tsx` handles the `#academy` view, the final-mission action, returning-learner routing, and heading focus when entering the hub.
- Existing versioned terminal progress remains unchanged. New course completion uses separate browser-local keys. No migration, account, additional cookie, analytics, model API, or server-side progress store is introduced. Direct `#course/<id>` navigation is gated by intro completion as well.

Completion is browser-local learning state, not authentication or protection for confidential material. Clearing site storage or changing browser/origin loses that completion. There is no server-side entitlement claim.

The hub ships inside the existing Academy application and container. Adding catalogue content does not need another Kubernetes workload or Argo CD Application. Publishing and deployment still use the existing reviewed image/digest and manual Argo CD sync process.

## Verification

The browser suite exercises the full seven-mission route into the hub, directory navigation/completion/history, planned course labels, refresh/root return, terminal revisit, reset/relock, direct course gate access, and both complete new course journeys on desktop and mobile. It also checks for horizontal overflow and unexpected external requests during the AI course. Unit tests cover read-only navigation, unsupported commands, Git snapshots/branch isolation, and independent completion recovery.
