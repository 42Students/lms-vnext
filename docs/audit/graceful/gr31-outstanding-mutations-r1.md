# GR-31 residual business mutation inventory — main at 8736e0c (2026-10-17)

Chat-14 inspected all 256 files whose Git blob SHAs differ from the original
`docs/audit/graceful/raw-error-allowlist.json` baseline on main.

A **mutating fetch matched the GR-31 detector** and the component did not
call `useGuardedAction(` in each of the 27 files below. These are real
verification debt, **not DONE** and not a justification to refresh the baseline.
The separate shared membership chooser was fixed by chat-14 in
`src/components/auth/membership-chooser.tsx`, with a named GR-31 test.

| Product area | File | Needed change |
| --- | --- | --- |
| College academic workflows | `src/components/academics/college-cohort-management.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Learner notifications | `src/components/activity/learner-notifications-inbox.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Shared notification toolbar | `src/components/activity/notification-toolbar.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Super Admin department actions | `src/components/admin/department-actions.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Super Admin department create | `src/components/admin/department-create-form.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Super Admin lecture halls | `src/components/admin/lecture-hall-manager.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Admin person onboarding | `src/components/admin/person-onboard-dialog.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Super Admin attendance settings | `src/components/admin/super-admin-attendance-settings-editor.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Super Admin batch graduation | `src/components/admin/super-admin-batch-graduate-action.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Faculty attendance | `src/components/attendance/faculty-attendance-workspace.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Faculty assessment editing | `src/components/courses/faculty-assessment-editor.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Faculty quiz review | `src/components/courses/faculty-quiz-review.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Learner quiz | `src/components/courses/learner-quiz-attempt.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Learner video progress | `src/components/courses/learner-video-player.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Learner YouTube progress | `src/components/courses/learner-youtube-player.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Course resource progress | `src/components/courses/resource-progress-control.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Learner applications | `src/components/placements/learner-applications-browse.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Learner placement jobs | `src/components/placements/learner-placement-jobs.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Learner placement offers | `src/components/placements/learner-placement-offers.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| TPO bulk round results | `src/components/placements/tpo-bulk-round-result-recorder.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| TPO college rules | `src/components/placements/tpo-college-rules-control.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| TPO drive selection | `src/components/placements/tpo-drive-selection-manager.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| TPO public placements | `src/components/placements/tpo-public-placement-toggle.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| TPO calendar | `src/components/placements/tpo-week-hour-calendar.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| Learner project board | `src/components/projects/learner-board-interactive.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| TPO follow-up | `src/components/tpo/tpo-new-followup-modal.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |
| TPO placement cell read | `src/components/tpo/tpo-placement-cell-read-action.tsx` | Guard each mutating action with `useGuardedAction`, retain state and error handling, test GR-31 |

## How the owning lanes close these

1. Merge latest main before each edit and preserve legacy page copy.
2. Use the shared synchronous pending lock around the **actual HTTP mutation**,
   not an unused hook import or a comment-only marker; disable save controls
   while pending and release the lock after failures/timeouts.
3. Avoid rendering provider messages or codes; `apiFetch` and
   `friendlyApiError` are the shared contracts.
4. Add a test **named with GR-31** for each affected page and record evidence
   in the owning lane's page verification document.
5. Do **not** modify `docs/audit/graceful/raw-error-allowlist.json` merely
   to silence CI. `tests/unit/graceful-raw-error-scan.test.ts` must stay red
   until all unguarded writes are actually fixed.

GR-09 audit found one JSX false positive in
`src/components/hr/hr-drive-draft-form.tsx`:
`result.error.issues.map` is **local Zod validation**, not a raw HTTP error.
The scanner now excludes that field-detail form while still detecting
`{result.error}` and `{body.error}`.
These findings are static-source checks, **not executed tests**.
