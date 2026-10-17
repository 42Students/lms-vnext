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

| COL-course-tabs-17 | DONE | `src/components/courses/college-content-preview.tsx`, `src/components/courses/college-content-aggregate.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-17` (OD-35 metadata-only) |
| COL-course-tabs-19 | DONE | `src/modules/courses/college-content-csv-model.ts`, `src/components/courses/college-content-csv-export.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts`, `COL-course-tabs-19` |

OPEN/PARTIAL: COL-course-tabs-01/02/03/04/14/15/16/18/23/26/27.
COL-course-tabs-19 exports are now page-scoped CSV for Videos, Resources and Live Classes; COL-course-tabs-16 still lacks registered Section ordering. Do not mark either DONE.
Lesson bulk changes now call the shared `apiFetch` helper so failed writes preserve
the selection and return plain retry guidance.
| COL-course-tabs-22 | DONE | `src/components/courses/college-course-missing-scope.tsx`, eight College Courses & Content pages; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts` test `COL-course-tabs-22` |

### Continued open-gap regression contracts

| Gap | Status | Evidence | Still open |
|---|---|---|---|
| COL-course-tabs-03 | PARTIAL | `src/components/courses/college-content-authoring-control.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts` test `COL-course-tabs-03` | Private file attachments and up-to-20-material editing remain dependent on DB05/storage |
| COL-course-tabs-04 | PARTIAL | `src/components/courses/college-assignment-create.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts` test `COL-course-tabs-04` | Attachments and link authoring still not full legacy parity |
| COL-course-tabs-14 | PARTIAL | `src/components/courses/college-lesson-reorder-actions.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts` test `COL-course-tabs-14` | Drag-and-drop and one-list reorder/rollback are not implemented |
| COL-course-tabs-16 | PARTIAL | `src/components/courses/college-content-authoring-control.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts` test `COL-course-tabs-16` | Per-Section custom ordering still requires DB05 |
| COL-course-tabs-18 | PARTIAL | `src/components/courses/college-content-aggregate.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts` test `COL-course-tabs-18` | Course and Lesson picker filtering across pages remains incomplete |

| COL-course-tabs-27 | PARTIAL | `src/components/courses/college-learning-directory.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts` test `COL-course-tabs-27`: lessons and progress now have syntactically valid independently keyed mobile-card branches; assignments/quizzes remain horizontal-scroll layouts requiring separate responsive acceptance. |

| COL-course-tabs-27 | DONE | Lessons/Progress use independent keyed mobile cards and desktop-only tables in `college-learning-directory.tsx`, Assignments/Quizzes use mobile cards with review actions and hide wide tables below sm in `college-assessment-aggregate.tsx`; `tests/unit/chat4-college-course-tabs-gap-closure.test.ts` test `COL-course-tabs-27`. |
