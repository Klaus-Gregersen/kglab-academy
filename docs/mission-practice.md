# Practice completed missions

Completed mission buttons open an interactive exercise rather than only its demonstration. Reopening a completed terminal course from the Academy begins with **Where Am I?**, so learners can try `pwd` again. Any completed mission can be selected from the sidebar in any order.

## Independent exercise state

- Each exercise starts from that mission's existing `startingState` fixture. This supplies prerequisite directories and reading files without copying the learner's later workspace.
- The command interpreter, objective validation, optional hints, walkthrough, and final project checklist use the selected exercise's state.
- **Practice mode** is labelled explicitly. The progress bar continues to show earned course completion. An exercise gets its own completion feedback only after its objective validates again.
- **Practice again** resets only that exercise. Selecting another completed mission creates a new exercise. These actions cannot unlock unfinished missions or change the Academy gate.
- **Return to your course** restores the saved current mission, files, and original in-session terminal draft, output, and command history. Practice has its own terminal memory.
- Community navigation and browser Back preserve an active exercise during the same app session. Refreshing ends practice and resumes the saved course position. Course completion remains saved; it never needs to be earned again for replay.
- The existing explicit **Reset course progress** dialog still resets the whole course, including its completion gate; it also exits practice. It is distinct from **Practice again**.

No new storage key or progress migration is needed. `src/state/practice.ts` is session-only; practice commands do not call the saved-progress update path. `src/App.tsx` selects the correct mission, machine, validation result, and terminal memory for each mode.

Unit tests run every mission's solution against its practice fixture. Browser tests cover completed-course entry, replaying the first and file lessons, exercise reset, unchanged saved progress, preserved course drafts/history/files, returning to the saved mission, refresh, Academy unlock, and desktop/mobile layout.
