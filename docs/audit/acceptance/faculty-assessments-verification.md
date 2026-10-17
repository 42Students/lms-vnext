# Faculty / Assessments — chat-6 verified closure

Source evidence cross-checked against `docs/audit/pages/faculty/assessments.md`. Tests are authored but **not run**; orchestrator must execute them, including relevant PostgreSQL cases, before acceptance.

| ID | Status | Evidence (implementation, test name) |
|---|---|---|
| FAC-assessments-12 | DONE | `src/components/courses/faculty-assessment-create.tsx`; `tests/unit/chat6-faculty-assessments-create-legacy.test.ts` → `FAC-assessments-12 requires course and lesson before Continue and exposes exact selection copy` |
| FAC-assessments-02 | DONE | `src/modules/courses/assignment-submission-methods.ts`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-02 allowed legacy submission methods` |
| FAC-assessments-03 | DONE | `src/components/courses/faculty-choice-quiz-builder.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-03 quiz shuffle controls and persisted options` |
| FAC-assessments-04 | DONE | `src/components/courses/faculty-choice-quiz-builder.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-04 due dates required for publishing` |
| FAC-assessments-05 | DONE | `src/components/courses/faculty-assessment-operation-model.ts`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-05 deadline-driven quiz result release` |
| FAC-assessments-06 | DONE | `src/components/courses/faculty-assignment-review.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-06 single-click grade save and publication` |
| FAC-assessments-07 | DONE | `src/modules/courses/assignment-submission-service.ts`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-07 grade publication and submission notifications` |
| FAC-assessments-08 | DONE | `src/components/courses/faculty-quiz-review.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-08 release and withhold confirmations` |
| FAC-assessments-09 | DONE | `src/components/courses/faculty-quiz-learner-preview.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-09 faculty learner-style quiz preview` |
| FAC-assessments-10 | DONE | `src/components/courses/faculty-assessment-overview.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-10 legacy quiz list status vocabulary` |
| FAC-assessments-16 | DONE | `src/components/courses/faculty-assessment-lifecycle-model.ts`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-16 delete confirmation copy and history protection` |
| FAC-assessments-17 | DONE | `src/components/courses/faculty-assessment-overview.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-17 legacy faculty empty states` |
| FAC-assessments-18 | DONE | `src/components/courses/faculty-choice-quiz-builder.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-18 per-question 100 point limit` |
| FAC-assessments-19 | DONE | `src/components/courses/faculty-assignment-editor.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-19 per-assignment 1000 point limit` |
| FAC-assessments-21 | DONE | `src/components/courses/faculty-assignment-review.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-21 grading student navigation and picker` |
| FAC-assessments-23 | DONE | `src/components/courses/faculty-assignment-review.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-23 grade pending and graded points wording` |
| FAC-assessments-29 | DONE | `src/components/courses/faculty-assessment-overview.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-29 stacked mobile assessment and grading actions` |
| FAC-assessments-30 | DONE | `src/components/courses/faculty-assessment-overview.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-30 legacy all courses filter` |
| FAC-assessments-25 | NOT-A-GAP | `src/components/courses/faculty-assessment-overview.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-25 NOT-A-GAP legacy overview fields now shown` |
| FAC-assessments-26 | NOT-A-GAP | `src/components/courses/faculty-assignment-review.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-26 NOT-A-GAP zero-submission draft review supported` |
| FAC-assessments-28 | NOT-A-GAP | `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx`; `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` → `FAC-assessments-28 NOT-A-GAP report headings and download exist` |

Remaining unverified / still open: FAC-assessments-01, FAC-assessments-11, FAC-assessments-13, FAC-assessments-14, FAC-assessments-15, FAC-assessments-20, FAC-assessments-22, FAC-assessments-24, FAC-assessments-27, FAC-assessments-R01/R02/R03/R04/R05/R06/R07/R08, FAC-attendance-grades-R01/R02. Storage-backed assignment resources / inline file previews require private storage and scanner support; do not claim closure based on UI copy alone.
