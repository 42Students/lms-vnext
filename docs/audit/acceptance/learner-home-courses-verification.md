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

| LEARNER-home-courses-04 | DONE | `src/components/courses/learner-course-list.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-04` |
| LEARNER-home-courses-16 | PARTIAL | `src/components/courses/learner-course-attendance.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-16` (month/history/day restored, legacy summary layout pending) |
| LEARNER-home-courses-23 | DONE | `src/components/courses/learner-course-overview.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts` test `LEARNER-home-courses-23` |

Partial (NOT claimed DONE): LEARNER-home-courses-15 (legacy Next up copy adjusted; due labels differ),
-19 (send/refresh copy and friendly failure handling; native delete confirmation remains),
-20 (authors may delete own pinned posts; pinned strip still differs),
-21 (beforeunload guard exists; in-app navigation guard and persistent draft still pending).
LEARNER-home-courses-01/02/03/05/08/10/12/14/16(partial)/18/22 remain open until full functionality is implemented.
| LEARNER-course-detail-R01 | DONE | `src/modules/courses/progress-service.ts`, `src/components/courses/learner-video-player.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-course-detail-R01` |
| LEARNER-course-detail-R03 | DONE | `src/modules/courses/learner-course-service.ts`, `src/components/courses/learner-live-class-link.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-course-detail-R03` |
| LEARNER-home-courses-10 | DONE | `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/not-found.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-home-courses-10` |
| LEARNER-home-courses-12 | DONE | `src/modules/courses/learner-course-tab-context-model.ts`, `src/components/courses/learner-course-document-title.tsx`, `src/components/courses/learner-course-tabs.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-home-courses-12` |
| LEARNER-home-courses-19 | DONE | `src/components/courses/learner-course-discussion.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-home-courses-19` |
| LEARNER-home-courses-21 | DONE | `src/components/courses/learner-course-discussion.tsx`; `tests/unit/chat4-learner-home-courses-gap-closure.test.ts`, `LEARNER-home-courses-21` |
