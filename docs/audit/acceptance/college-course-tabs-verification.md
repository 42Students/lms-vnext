# College Course Tabs — chat-4 gap verification

Audit: `docs/audit/pages/college/course-tabs.md`. Tests written, NOT RUN. Source-backed
DONE claims are provisional until orchestrator integration and runtime checks pass.

| ID | Status | Evidence |
|---|---|---|
| COL-course-tabs-05 | DONE | `src/components/courses/college-assignment-review.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-05` |
| COL-course-tabs-06 | DONE | `src/components/courses/college-quiz-create.tsx`, `src/components/courses/college-quiz-actions.tsx`, `src/components/courses/college-quiz-attempts.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-06` |
| COL-course-tabs-07 | DONE | `src/components/courses/college-assessment-aggregate.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-07` |
| COL-course-tabs-08 | DONE | `src/components/courses/college-learner-progress-report.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-08` |
| COL-course-tabs-09 | DONE | `src/components/courses/college-learner-progress-report.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-09` |
| COL-course-tabs-10 | DONE | `src/components/courses/college-learner-progress-report.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-10` |
| COL-course-tabs-11 | DONE | `src/components/courses/college-assessment-aggregate.tsx`, `src/modules/courses/college-assessment-aggregate-service.ts`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-11` |
| COL-course-tabs-12 | DONE | `src/app/(authenticated)/college/lessons/page.tsx`, `src/components/courses/college-lesson-create-control.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-12` |
| COL-course-tabs-13 | DONE | `src/components/courses/college-learning-directory.tsx`, `src/components/courses/college-lesson-visibility-controls.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-13` |
| COL-course-tabs-24 | DONE | `src/components/courses/college-learning-directory.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-24` |

OPEN/PARTIAL: COL-course-tabs-01/02/03/04/14/15/16/17/18/19/22/23/26/27.
In particular, COL-course-tabs-19 still lacks full CSV parity for Videos, Resources and Live
Classes; COL-course-tabs-16 still lacks registered Section ordering. Do not mark either DONE.
Lesson bulk changes now call the shared `apiFetch` helper so failed writes preserve
the selection and return plain retry guidance.
