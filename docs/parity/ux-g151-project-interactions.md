# UX-G151 — Project interactive components

**Canonical status: DOING.** The 15 assigned components are tracked in `docs/tracker.json#uxReview.groups[UX-G151]`. This checkpoint is partial implementation, **not closure certification**.

## Implementation — 8 November 2026

- `learner-own-task-controls.tsx`: task create and delete reject rapid repeat submissions with synchronous ref locks before React pending state updates; create retains sprint-version checks. Locks release in `finally` for error recovery.
- `mentor-meeting-notes-editor.tsx` and `mentor-meeting-reschedule.tsx`: meeting outcome/reschedule confirmations reject duplicate PATCH actions; existing version tokens, error handling and retry remain.
- `learner-project-mobile-filters.tsx`: native selects reinitialize when the URL-backed query props change (browser back/forward and Clear filters). Direct submit cancels any scheduled search submission.
- `learner-board-task-detail-dialog.tsx`: remove duplicate acceptance-criteria section while preserving the blocked-task alert.
- `mentor-lane-board.tsx`: serialize task status changes and sprint moves with a shared synchronous lock; preserve existing mutation-version checks and release on failure.
- `tests/unit/UX-G151-project-interaction-guards.test.ts`: source regression checks for these changes.

## Not yet accepted

Source assertions are **not** executed test or browser proof. Before marking DONE, execute focused unit and functional tests, lint and strict TypeScript at an identified commit. Exercise authenticated 390px mobile and desktop browser flows: searching, select/back/forward/clear, fast double-taps on create/delete/PATCH, loading, stale version, failure/retry, modal cancel and keyboard focus. Confirm positive and negative authorization and tenant ownership in the mutation services. Audit all remaining source files in the 15-file group, not just these six. Attach exact run links, browser proof, regression and security review to the canonical group record. Until then, keep UX-G151 in DOING.
