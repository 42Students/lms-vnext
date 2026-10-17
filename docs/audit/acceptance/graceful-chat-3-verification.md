# Chat-3 graceful operation — touched-page evidence

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md`, checklist `docs/audit/graceful/CHECKLIST.md`. Tests are **written but not run**, `tests/unit/chat-3-graceful-pages.test.ts`. This evidence applies to **College Courses & Content**, **College Attendance**, and **Learner Profile & Learning** only; it does not declare all LMS routes covered.

| GR ID | Page-scope status | Evidence (file and named test) |
| --- | --- | --- |
| GR-19 | DONE | Offering `loading.tsx`, college attendance `loading.tsx`, learner profile `loading.tsx`, test `GR-19 course detail, college attendance and learner profile show loading skeletons` |
| GR-20 | DONE | Each route's `error.tsx` renders human-readable failure with Retry, test `GR-20 page-level errors offer Retry rather than a raw framework failure` |
| GR-31 | PARTIAL | Attendance correction pending disable; learner contact pending lock. Shared chat-14 `useGuardedAction` not yet on main. Test `GR-31 mutating attendance correction and learner contact save guard duplicate actions` |
| GR-32 | PARTIAL | Correction 409 message preserves drawer; learner contacts stale notice. Global rebase/re-apply action still requires helper. Test `GR-32 concurrent attendance correction shows recovery text without discarding learner selection` |
| GR-35 | DONE | Attendance correction in named drawer without `window.confirm`; course archive uses ConfirmDialog. Test `GR-35 attendance correction uses named drawer instead of disruptive browser confirm` |
| GR-71 | DONE | Courses catalogue has filtered-empty notice; attendance distinguishes no delivery/roster/sessions. Loading and route failure handled separately. Test `GR-71 course catalogue and attendance lists explain empty vs filtered empty` |
| GR-73 | PARTIAL | URL filters persist through attendance navigation, invalid query gets recoverable notice. Test `GR-73 invalid attendance filters recover without losing valid selection in navigation` |
| GR-90 | DONE | Attendance mutation and course error boundary use role=alert and messages, test `GR-90 no raw error code in corrected attendance alert and course load error summary` |
| GR-91 | DONE | Retry buttons are native keyboard focusable, test `GR-91 Retry is keyboard-accessible in all three role error screens` |

Open per-page items requiring further work after chat-14 merges: adopt `src/lib/friendly-error.ts`, `apiFetch`, shared guarded action and draft hooks; support card-level partial failures and auto-retry without losing user input. These helpers were absent from main at round start. **No browser acceptance has been executed; accessibility/contrast remains unverified.**
