# Learner Home / Courses verification — chat-4
Audit: `docs/audit/pages/learner/home-courses.md` and reviewed corrections.
Tests authored but NOT RUN. DONE below means source-backed parity subject to orchestrator execution.

| ID | Status | Evidence |
|---|---|---|
| LEARNER-home-courses-06 | DONE | `src/modules/courses/learner-course-result-summary-model.ts; learner-course-filtered-empty-model.ts`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-06` |
| LEARNER-home-courses-07 | DONE | `src/modules/courses/learner-course-card-search-model.ts`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-07` |
| LEARNER-home-courses-09 | DONE | `src/app/(authenticated)/learn/courses/error.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-09` |
| LEARNER-home-courses-11 | DONE | `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-11` |
| LEARNER-home-courses-13 | DONE | `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-13` |
| LEARNER-home-courses-R01 | DONE | `src/app/(authenticated)/learn/courses/page.tsx; src/modules/courses/learner-course-list-concurrency-model.ts`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-R01` |

Partial (NOT claimed DONE): LEARNER-home-courses-15 (legacy Next up copy adjusted; due labels differ),
-19 (send/refresh copy and friendly failure handling; native delete confirmation remains),
-20 (authors may delete own pinned posts; pinned strip still differs),
-21 (beforeunload guard exists; in-app navigation guard and persistent draft still pending).
LEARNER-home-courses-01/02/03/04/05/08/10/12/14/16/18/22/23 remain open until full functionality is implemented.
