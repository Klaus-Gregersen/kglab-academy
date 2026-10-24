# Academy course hub

Terminal Fundamentals is the introduction and the only completion gate for the Academy. Completing all seven missions unlocks the hub at `#academy`. Future courses do not introduce a chain of additional completion prerequisites.

## Learner journey

1. New learners arrive at the public homepage and start the terminal introduction.
2. Opening **Academy** before finishing shows a closed gate, the current mission count, and a start/continue button. Opening `#academy` directly follows the same rule. There is no skip-intro control.
3. Finishing the final mission leaves its output and feedback visible. **Unlock your academy** takes the learner into a separate landing page.
4. The unlocked hub shows the completed foundation, the future course catalogue, and a link to free community resources.
5. Returning to the root URL with completed progress opens the hub. `#workspace` and **Revisit your terminal** open the original terminal, preserving its files and progress. Explicit homepage links remain available.
6. Resetting the intro clears completion and closes the gate again. Partial progress never unlocks the hub.

The community shelf remains publicly accessible. The homepage’s learning path is a public preview, not entry into future lessons. All eight future courses are labelled **Planned** and have no launch buttons; an unlocked hub does not mean those courses are implemented.

## Implementation

- `src/courses/catalogue.ts` is the shared metadata for the homepage and hub. It includes the existing DevOps roadmap plus AI Fundamentals, whose proposed topics cover prompting, agents, and local/on-premises/cloud deployment choices.
- `src/components/AcademyPage.tsx` renders the closed gate or unlocked hub from the validated terminal completion count.
- `src/App.tsx` handles the `#academy` view, the final-mission action, returning-learner routing, and heading focus when entering the hub.
- Existing versioned terminal progress remains unchanged. No migration, account, additional cookie, analytics, model API, or server-side progress store is introduced.

Completion is browser-local learning state, not authentication or protection for confidential material. Clearing site storage or changing browser/origin loses that completion. There is no server-side entitlement claim.

The hub ships inside the existing Academy application and container. Adding catalogue content does not need another Kubernetes workload or Argo CD Application. Publishing and deployment still use the existing reviewed image/digest and manual Argo CD sync process.

## Verification

The browser suite exercises the full seven-mission route into the hub, planned course labels, refresh/root return, terminal revisit, reset/relock, and direct/partial-progress gate access on desktop and mobile. It also checks for horizontal overflow.
