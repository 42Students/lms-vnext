# Chat-7 overlay UX coverage and keyboard contract

Source: `docs/audit/ux/COVERAGE-MATRIX.md` and `docs/audit/ui-surfaces/UI-SURFACES.md`. Every entry below is explicitly named in `tests/unit/UX-courses-attendance-overlays-01.test.ts`.

The shared `Dialog`, `Drawer` and `ConfirmDialog` provide native `showModal()` focus containment; Escape and backdrop dismissal subject to `dismissible`; opener focus restoration; an accessible title; mobile viewport geometry; safe-area footer; and a `ScrollCue` for long content. The per-overlay tests also check the explicit user intent/guard or accessible selection labels; they are source-level contracts, not a substitute for browser keyboard testing.

| Overlay files (in `src/components/`) | Behaviour checked |
|---|---|
| attendance/college-attendance-policy-form.tsx | Destructive reset asks for confirmation and respects pending state |
| courses/admin-course-actions.tsx | Course edits prompt on dirty close; archive has confirmation |
| courses/admin-course-create-panel.tsx | Offering creation confirms before committing |
| courses/admin-learning-structure-actions.tsx | Learning-path edits use modal and transition confirmation |
| courses/assignment-submission-control.tsx | Typed submission discards with explicit confirmation |
| courses/college-archived-lesson-restore.tsx | Restore action explicitly confirms |
| courses/college-content-preview.tsx | Replaced ad hoc overlay with accessible shared Dialog; no private content exposed |
| courses/college-lesson-reorder-actions.tsx | Ordering action confirms |
| courses/faculty-assessment-create.tsx | Drawer selects class and lesson before assessment |
| courses/faculty-assessment-editor.tsx | Drawer confirms corrections and preserves submitted assessment constraints |
| courses/faculty-assignment-review.tsx | Drawer labels filters and student navigation |
| courses/faculty-content-editor.tsx | Dirty edits require confirmation before dismissing |
| courses/faculty-lesson-authoring.tsx | Unsaved authoring draft requires discard confirmation |
| courses/faculty-quiz-question-editor.tsx | Question-bank replacement requires confirmation |
| courses/faculty-quiz-review.tsx | Review drawer supports return to the list |
| courses/faculty-report-download.tsx | Incomplete report prompts before download |
| courses/learner-roadmap-item-dialog.tsx | Moved native hand-built learner overlay to shared Dialog for focus return and scroll cues; authorized children still mount only when open |
| courses/resource-progress-control.tsx | Mark-complete action asks for confirmation |

Coverage outcome: 18 previously undocumented overlay surfaces have explicit tests and this note. The test source asserts behaviour without deleting legacy copy. Browser keyboard/touch runtime checks remain a separate step.
