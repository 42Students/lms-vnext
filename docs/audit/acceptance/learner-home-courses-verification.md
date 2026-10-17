# Learner Home / Courses verification — chat-4

Audit: `docs/audit/pages/learner/home-courses.md` and Round R review.

Tests are authored but **NOT RUN**. A DONE below is source-backed parity that requires
orchestrator test execution before full acceptance.

| ID | Status | Evidence |
|---|---|---|
| LEARNER-home-courses-06 | DONE | `src/modules/courses/learner-course-result-summary-model.ts; learner-course-filtered-empty-model.ts`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-06` |
| LEARNER-home-courses-07 | DONE | `src/modules/courses/learner-course-card-search-model.ts`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-07` |
| LEARNER-home-courses-09 | DONE | `src/app/(authenticated)/learn/courses/error.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-09` |
| LEARNER-home-courses-11 | DONE | `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-11` |
| LEARNER-home-courses-13 | DONE | `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-13` |
| LEARNER-home-courses-R01 | DONE | `src/app/(authenticated)/learn/courses/page.tsx; src/modules/courses/learner-course-list-concurrency-model.ts`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-R01` |
| LEARNER-home-courses-04 | DONE | `src/components/courses/learner-course-list.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-04` |
| LEARNER-home-courses-23 | DONE | `src/components/courses/learner-course-overview.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-23` |
| LEARNER-course-detail-R01 | DONE | `src/modules/courses/progress-service.ts`, `src/components/courses/learner-video-player.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-course-detail-R01` |
| LEARNER-course-detail-R03 | DONE | `src/modules/courses/learner-course-service.ts`, `src/components/courses/learner-live-class-link.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-course-detail-R03` |
| LEARNER-home-courses-10 | DONE | `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/not-found.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-home-courses-10` |
| LEARNER-home-courses-12 | DONE | `src/modules/courses/learner-course-tab-context-model.ts`, `src/components/courses/learner-course-document-title.tsx`, `src/components/courses/learner-course-tabs.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-home-courses-12` |
| LEARNER-home-courses-19 | DONE | `src/components/courses/learner-course-discussion.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-home-courses-19` |
| LEARNER-home-courses-21 | DONE | `src/components/courses/learner-course-discussion.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-home-courses-21` |
| LEARNER-home-courses-16 | DONE | `src/components/courses/learner-course-attendance.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-home-courses-16` — legacy summary card / percentages; extra safety note for unmarked classes. |
| LEARNER-home-courses-20 | DONE | `src/components/courses/learner-course-discussion.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-home-courses-20` — pinned author/count and own pinned deletion. |

## Remaining open or partial differences

- `LEARNER-home-courses-15`: overview due labels and all legacy quick-link presentation details are not fully reproduced.
- `LEARNER-home-courses-01/02/03/05/08/14/18/22`: landing decision, future and academic setup semesters, elective slot labels, scale, announcements, attendance query scope, and polling parity remain open.
- Additional learner detail gaps stay in their own page queue. No uploads, privileged data or storage gates were bypassed.
- Verification here is source-level only; no tests, typecheck, lint, build or database acceptance executed by this builder.

| LEARNER-course-detail-R04 | DONE | `learner-course-file-reference-service.ts` resolves exactly one authorized learner-owned visible content reference; route signs 15-minute R2 GET and redirects rather than hydrating workspace or proxying download/range bytes; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-course-detail-R04`. |

| LEARNER-home-courses-03 | DONE | `learner-course-setup-service.ts` diagnoses current enrollment/program/batch/class/term before showing `learnerCourseSetupCopy` administrator recovery instructions, instead of generic missing-courses state; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-03`. |

## chat-15 UNCONFIRMED decisions (2026-10-18; no shell or restyling)

| ID | Disposition | Evidence / rationale |
|---|---|---|
| LEARNER-home-courses-01 | NOT-A-GAP | Keep the deliberate shared `/dashboard` for multi-role memberships with `Active Courses` linking to `/learn/courses`; removing other workspaces would be a regression. `src/app/(authenticated)/dashboard/page.tsx`; `tests/unit/chat15-unconfirmed-decisions.test.ts`, `LEARNER-home-courses-01 deliberately preserves a multi-role dashboard and a dedicated learner courses link`. |
| LEARNER-home-courses-14 | OPEN (implementation decision recorded) | The legacy GENERAL class/course announcement feed must come from tenant-, class-, course- and recipient-scoped official announcements, newest two. Faculty discussion messages are not that source, and must not be relabeled or mixed as official announcements. `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx`; `tests/unit/chat15-unconfirmed-decisions.test.ts` test `LEARNER-home-courses-14 does not pass off discussions as official announcements` checks current honest behavior, not parity. Requires a server-side announcement query and permissions. |

| LEARNER-home-courses-15 | DONE (source; execution pending) | `src/components/courses/learner-course-overview.tsx` includes Assessment, Discussion, Live Session shortcuts and the Start learning next-action label. `tests/unit/chat4-gap-verified-cross-role-round2.test.ts` test `LEARNER-home-courses-15`. Browser and exact dynamic due-date copy need orchestrator acceptance. |

| LEARNER-home-courses-18 | DONE (source; execution pending) | `src/modules/attendance/learner-service.ts` now accepts the authorized delivery ID alongside its existing timestamp window and enforces membership before querying one delivery; `src/modules/attendance/learner-course-attendance-ist-model.ts` computes strict half-open IST month bounds; `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx` fetches one selected month and remounts by month, while `src/components/courses/learner-course-attendance.tsx` updates the URL when the month changes instead of presenting falsely empty historical data. `tests/unit/chat4-learner-attendance-month-scope.test.ts` tests named `LEARNER-home-courses-18`. No executed PostgreSQL/browser acceptance. |
