# Start each mission at its description

The mission brief groups the title, command explanation, objective, and walkthrough entry inside a bordered panel with a green left edge. A **Start here** label and a short instruction pointing to the terminal establish the reading order without another dialog or automatic animation.

Entering or returning to the terminal workspace, reloading it, advancing to another mission, and resetting the course move the viewport to this panel. Its title receives programmatic keyboard focus so assistive technology also receives the new mission context. Scrolling is immediate, including for learners who prefer reduced motion.

While the workspace is open, its entry positioning takes precedence over browser scroll restoration. A resize observer corrects initial layout shifts as the lazy terminal and styles load, but only while the mission heading still has focus. Moving into the terminal or another control ends those corrections; the observer is disconnected on mission/view changes.

This behavior runs on workspace entry, mission changes, or explicit reset. It does not run for each command, completion update, draft change, or hint. Learners keep their terminal focus while practicing rather than being returned to the description. **Try it myself** in the walkthrough still moves focus to the terminal deliberately; closing a walkthrough restores its original trigger as before.

Implementation is in `src/App.tsx` (`focusMissionBrief` and the mission-entry effect) and `src/styles.css` (`.mission-brief`, `.mission-kicker`, `.mission-practice-cue`). Browser checks in `tests/mission-entry.spec.ts` cover viewport position, heading focus, command focus, mission changes, refresh, workspace return, reduced motion, reset, and mobile overflow. The existing walkthrough tests cover returning to practice.
