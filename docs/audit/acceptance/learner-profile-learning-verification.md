# Learner profile-learning — gap verification evidence (chat-3 round 2)

Scope: `docs/audit/pages/learner/profile-learning-review.md` and `profile-misc.md`, plus `learning-misc.md`. Protocol `docs/orchestrator/briefs/gap-closure-lane.md`. All five gap-ID-named tests live in `tests/unit/learner-profile-learning-gap-closure.test.ts` and are **written, not executed**.

| ID | Status | File and named test / remaining work |
| --- | --- | --- |
| LEARNER-learning-misc-R01 | OPEN | `src/modules/courses/assignment-submission-service.ts` now inserts own learner grade notice in transaction; `learner-assignment-due-notice-model.ts` computes upcoming unsubmitted items. No scheduled delivery of due-soon notices yet; no email/provider result asserted. Test LEARNER-learning-misc-R01 |
| LEARNER-profile-misc-R01 | OPEN | Notification inbox exists at `/learn/notifications`; the topbar bell remains a simple link without the eight-item drawer. **Shell-only:** chat-9 owns `src/components/shell/learner-topbar-tools.tsx`. Test LEARNER-profile-misc-R01 checks currently existing safe navigation without falsely claiming drawer completion. |
| LEARNER-profile-misc-R02 | DONE | Persisted `jobPreferences` roles, specific role, shift and city in `src/modules/people/profile-validation.ts`, learner editor in `src/components/profile/learner-profile-workspace.tsx`; test LEARNER-profile-misc-R02 |
| LEARNER-profile-misc-R04 | DONE | Client and server check 10–15 digit alternate mobile; server compares with persisted primary phone under college-scoped membership and returns friendly error; `learner-contact-model.ts`, `learner-contact-service.ts`, learner profile editor; test LEARNER-profile-misc-R04 |
| LEARNER-profile-misc-R05 | DONE | Weighted non-sensitive career completion and tier messages, shared by checklist and profile ring; `learner-profile-checklist.ts`, `learner-profile-career-coverage-model.ts`; test LEARNER-profile-misc-R05 |

Graceful checklist: editor already uses guarded pending states and 409 stale contact notice; unsafe same-phone changes are not saved. `GR-31`, `GR-32`, `GR-33` source claims must be validated by the orchestrator. Shared chat-14 friendly-fetch layer was not on main at round start.
