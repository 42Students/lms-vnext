# Faculty / Assessments — chat-6 verified closure

Source evidence cross-checked against `docs/audit/pages/faculty/assessments.md`. Tests are authored but **not run**; orchestrator must execute them, including relevant PostgreSQL cases, before acceptance.

| ID | Status | Evidence (implementation, test name) |
|---|---|---|
| FAC-assessments-01 | BLOCKED | Private PDF/File assignment resources require the object-storage bucket/scanner; see `docs/orchestrator/queues/gap-closure-chat-6.md` |
| FAC-assessments-22 | BLOCKED | Private inline PDF preview requires signed delivery and scanner-ready backing files; see queue note |
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

| FAC-assessments-11 | DONE | `src/components/courses/faculty-assessment-overview.tsx`; `tests/unit/chat6-faculty-assessment-parity-batch.test.ts` → `FAC-assessments-11 presents legacy assessment and course total pills above course breakdown` |
| FAC-assessments-14 | DONE | `src/components/courses/faculty-assignment-editor.tsx`, `src/components/courses/faculty-choice-quiz-builder.tsx`; `tests/unit/chat6-faculty-assessment-parity-batch.test.ts` → `FAC-assessments-14 saves routine drafts without redundant checkbox and confirm dialog` |
| FAC-assessments-20 | NOT-A-GAP | `docs/audit/pages/faculty/assessments.md` intentional section scoping plus `docs/audit/owner-decisions-resolved.md` OD-38; `tests/unit/chat6-faculty-assessment-parity-batch.test.ts` → `FAC-assessments-20 retains approved section-scoped quiz audience` |

| FAC-assessments-24 | DONE | `src/components/courses/faculty-quiz-review.tsx`, `src/components/courses/faculty-assessment-overview.tsx`; `tests/unit/chat6-faculty-round2.test.ts` → `FAC-assessments-24 submissions drawer shows quiz title count and legacy empty copy` |

| FAC-assessments-15 | DONE | `src/modules/courses/faculty-assignment-authoring-service.ts`, `src/modules/courses/faculty-assignment-authoring-model.ts`, `src/components/courses/faculty-assessment-editor.tsx`; `tests/unit/chat6-faculty-round2.test.ts` → `FAC-assessments-15 allows title corrections but locks deadline points and methods after submission` |

Remaining unverified / still open: FAC-assessments-13, FAC-assessments-27, FAC-assessments-R01/R02/R03/R04/R05/R06/R07/R08, FAC-attendance-grades-R01/R02. Storage-backed assignment resources / inline file previews require private storage and scanner support; do not claim closure based on UI copy alone.

| FAC-assessments-13 | DONE (source authored; runtime pending) | `src/components/courses/faculty-choice-quiz-builder.tsx`, `src/components/courses/faculty-assignment-editor.tsx`; `tests/unit/chat6-faculty-publish-now-round3.test.ts` → `FAC-assessments-13 defaults new quiz and assignment to Publish now and keeps a saved draft after publish failure` |

| FAC-assessments-R06 | DONE (source authored; browser pending) | `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx` restores the legacy Back link and visible Submitted, Average score, Questions and Due date tiles while retaining Total attempts in the downloadable report. `tests/unit/chat6-faculty-quiz-report-header-r06.test.ts` → `FAC-assessments-R06 shows the legacy Back link and Submitted, Average score, Questions and Due date metrics`. |

| FAC-assessments-R03 | DONE (source authored; browser pending) | `src/components/courses/faculty-assessment-create.tsx`, `faculty-assessment-editor.tsx`, `faculty-lesson-authoring.tsx`; `tests/unit/chat6-faculty-dirty-drawers-r03.test.ts` → `FAC-assessments-R03 protects edited create and edit drawers, reset after save and beforeunload`. |

| FAC-attendance-grades-R01 | NOT-A-GAP | Approved owner OD-05 reserves out-of-window correction to College Admin with required audit reason. vNext deliberately disallows faculty edits after the configured window in either direction; allowing an unlimited absence removal would bypass attendance integrity controls. `src/modules/attendance/faculty-marking-window.ts`, `tests/unit/chat6-college-tpo-and-attendance-policy.test.ts` → `FAC-attendance-grades-R01 keeps expired faculty correction window symmetric while college admins retain audited override`. |

| FAC-assessments-R08 | DONE (source authored; migration registration/database pending) | `src/db/schema/assessments.ts`, `src/modules/courses/{assignment-validation,faculty-assignment-authoring-model,faculty-assignment-editor-ui-model}.ts`, faculty editors; `docs/proposed-migrations/faculty-assessments-participation-zero-points.sql`; `tests/unit/chat6-faculty-zero-point-assignment-r08.test.ts` → `FAC-assessments-R08 permits zero-point participation assignments without allowing negative or noninteger marks`. |
