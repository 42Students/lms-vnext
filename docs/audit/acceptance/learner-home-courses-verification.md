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
