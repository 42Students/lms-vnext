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

| FAC-assessments-R04 | DONE (source authored; PostgreSQL/load validation pending) | `src/modules/courses/faculty-assessment-service.ts`, `src/modules/courses/faculty-assessment-batch-model.ts`; `tests/unit/chat6-faculty-assessment-r04-batched-scope.test.ts` → `FAC-assessments-R04 rejects sibling section records while retaining shared and own records`, `FAC-assessments-R04 reads only authorized teaching offerings in bounded batches, without full authoring workspaces`. Authorized delivery roster gates batched queries; no per-delivery full content/authoring workspace. |

## Chat-15 final sprint independent WRONG decisions (2026-10-18)

| Gap ID | Decision | Current source and gap-ID-named independent test |
|---|---|---|
| FAC-assessments-15 | NOT-A-GAP (original report wrong; existing behavior guarded) | `faculty-assignment-authoring-service.ts` rejects submitted-assignment changes to locked fields through `facultyAssignmentEditLockedBySubmissions` and retains title changes. `faculty-assessment-editor.tsx` has the legacy lock warning. `tests/unit/chat15-final-sprint-faculty-wrong.test.ts`: `FAC-assessments-15 WRONG: submitted assignments cannot move deadlines or points; title correction remains possible`. |
| FAC-assessments-25 | NOT-A-GAP (reported fields present) | `faculty-assessment-overview.tsx` shows Course, Section, Lesson, due state, draft/hidden status. Same test file: `FAC-assessments-25 WRONG: course, section, lesson, due-state and hidden draft are present`. A separate Created fallback is not silently claimed here. |
| FAC-assessments-26 | NOT-A-GAP (draft can open report; submissions may be empty) | `faculty-assessment-overview.tsx` exposes View Report and assignment report displays a real empty submission state. Same test file: `FAC-assessments-26 WRONG: every assessment links to its report, even without submissions`. |
| FAC-assessments-28 | NOT-A-GAP (legacy headings present) | `teacher/report/quiz/[quizId]/page.tsx`, `teacher/report/assignment/[contentId]/page.tsx`, `faculty-report-download.tsx`. Same test file: `FAC-assessments-28 WRONG: distinct quiz and assignment report sections have the requested copy`. |
  
Tests added but not executed in this GitHub connector session; orchestrator to run them.

## Chat-6 2026-10-18 re-audit: source-level evidence for queue FIXED-ON-MAIN

Earlier 'Remaining unverified' list predates these source inspections and tests. The cases below cite actual source contracts, **not executed tests or database/browser signoff**.

| Gap ID | Source disposition | Named unit test and acceptance evidence |
|---|---|---|
| FAC-assessments-R01 | FIXED-ON-MAIN — source verified; runtime pending | `tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts` test `FAC-assessments-R01`; Published assignment metadata-edit path permits PUBLISHED; after submissions, field-lock model rejects unsafe changes and keeps title correction. |
| FAC-assessments-R02 | FIXED-ON-MAIN — source verified; runtime pending | `tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts` test `FAC-assessments-R02`; Quiz deadline lock checks attempts and CLOSED status under a transactional edit path. |
| FAC-assessments-27 | FIXED-ON-MAIN — source verified; runtime pending | `tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts` test `FAC-assessments-27`; Unified faculty assessment overview exposes the typed create action for assignments and quizzes; full cross-page UI parity still needs browser walkthrough. |
| FAC-assessments-R05 | FIXED-ON-MAIN — source verified; runtime pending | `tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts` test `FAC-assessments-R05`; /teacher/allQuizzes accepts a bounded legacy content query and opens only a quiz present in the actor-scoped overview. |
| FAC-assessments-R07 | FIXED-ON-MAIN — source verified; runtime pending | `tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts` test `FAC-assessments-R07`; Quiz report shows learner names/scores only within score-distribution buckets using authorized report rows. |
| FAC-attendance-grades-R02 | FIXED-ON-MAIN scope/overlap guard source-verified; historical scheduling decision remains open for runtime acceptance | `tests/unit/chat6-faculty-schedule-and-tracker-evidence-round17.test.ts` test `FAC-attendance-grades-R02`; `faculty-schedule-mutation-service.ts` checks active faculty scope, period bounds, per-section locked scheduling and marked attendance before rescheduling. This does **not** prove legacy past-booking grace semantics or lecture-hall occupancy; follow-up must not claim these were added. |

## Chat-7 last gaps — 2026-10-18: corrective implementation after WRONG audit verdict

The original Round A assertions for the following IDs were overstated, as recorded by `docs/audit/gap-register.md`. We did **not** reverse previously correct guards or misrepresent a draft as having real submissions. Instead we implemented independently verifiable residual functionality.

| ID | Corrective implementation | Gap-named evidence |
|---|---|---|
| FAC-assessments-15 | The faculty assignment command now compares *actual normalized submission-method sets*, so an unchanged selection is not treated as a forbidden edit, and leaves the historical stored methods untouched. `getFacultyAssessmentOverview` batches authorized assignment submission existence and sends `hasSubmissions` to the editor. With learner submissions, the editor displays `Learner submissions exist` before editing, disables description/deadline/points, sends a title-only PATCH, and reserves the lock explanation for `ASSIGNMENT_HAS_SUBMISSIONS` rather than every HTTP 409 (which may mean stale version). The server-side in-transaction submission existence, unchanged-fields guard and version CAS remain authoritative. | `tests/unit/chat7-last-gaps-faculty-assessments.test.ts` → `FAC-assessments-15: submitted work locks true field changes but permits title-only corrections` |
| FAC-assessments-25 | The overview already had Course, Section, Lesson, Needs due date and Draft hidden. The residual missing `Created:` fallback is now displayed when there is no due date, and the course/lesson context includes the actual due date rather than only `Due date set`; dates come from persisted rows. | Same file → `FAC-assessments-25: due or created timestamps and course lesson scope information are shown` |
| FAC-assessments-26 | The draft `FacultyAssignmentReview` already existed, and its draft-only empty state remains database-independent and explicit. The overview now adds a direct `View submissions` action for *both* draft and published assignments, deep-linked to the actual submission review section on the permission-scoped report. No synthetic submission records are created. | Same file → `FAC-assessments-26: drafts and published assignments link to a real review with empty state` |
| FAC-assessments-28 | Original report section headings already matched the legacy contract. New `facultyReportIsIncomplete` computes participation/grading completeness from authoritative report metrics. Incomplete quiz/assignment PDF requests open `This report is incomplete` confirmation, requiring `Download marked incomplete` before generation. Confirmed PDFs actually include the incompleteness label in their summary, while complete downloads retain a single-click path. | Same file → `FAC-assessments-28: incomplete PDF must be confirmed and marked, complete report is immediate` |

**Validation limits:** Tests were authored on `chatgpt/chat-7-b` and commits cite all four IDs. The connected GitHub interface cannot execute Vitest, TypeScript, browser or database tests in this session; these should be run against the branch before merge. Original tracker `WRONG` entries are generated by the audit script and were intentionally not hand-edited.


## chat-15 final-sprint independent audit decisions (source review, tests not run)

The final-sprint audit labels were **WRONG** because the corresponding legacy capability is already implemented. These are NOT-A-GAP decisions, not assertions of a live-browser pass. The independent regression tests are in `tests/unit/chat15-final-sprint-fac-assessments.test.ts`.

| Gap ID | Decision | Existing behavior and regression evidence |
|---|---|---|
| FAC-assessments-15 | NOT-A-GAP | `facultyAssignmentEditLockedBySubmissions` blocks post-submission due date, points, description and submission methods while allowing title correction; `FAC-assessments-15 NOT-A-GAP` test. |
| FAC-assessments-25 | NOT-A-GAP | `faculty-assessment-overview.tsx` includes Course, Lesson, Needs due date, Draft · hidden from students and Created; `FAC-assessments-25 NOT-A-GAP` test. |
| FAC-assessments-26 | NOT-A-GAP | `faculty-assignment-review.tsx` shows draft zero-submission review with its publish guidance; `FAC-assessments-26 NOT-A-GAP` test. |
| FAC-assessments-28 | NOT-A-GAP | Quiz and assignment reports expose legacy section labels and incomplete-report PDF confirmation; `FAC-assessments-28 NOT-A-GAP` test. |

### chat-3 assessment publication, export and privacy hardening

| ID | Status | Verification evidence |
|---|---|---|
| FAC-assessments-05 / FAC-assessments-08 / FAC-QUIZ-RESULTS-STATE-01 | DONE (source/test authored; CI pending) | `tests/unit/chat3-faculty-assessment-publication-state-matrix.test.ts` verifies quiz publication requires closed state or passed deadline, explicit confirmation, nonduplicate release/hide and strict JSON command scope. |
| FAC-assessments-06 / FAC-assessments-07 / FAC-ASSIGNMENT-GRADE-STATE-01 | DONE (source/test authored; CI pending) | Same test file verifies grading bounds, empty score never becoming zero, no repeat grade release and publication only from saved GRADED values. |
| FAC-QUIZ-PII-01 | DONE (source/test authored; CI pending) | `src/modules/courses/faculty-quiz-attempts-service.ts` no longer displays the learner's email as a missing name fallback; `tests/unit/chat3-faculty-quiz-attempts-privacy-service.test.ts` checks actual service projection, role scope and private answer fields. |
| FAC-QUIZ-CSV-SERVICE-01 | DONE (source/test authored; CI pending) | `tests/unit/chat3-faculty-quiz-question-csv-service.test.ts` verifies strict quiz/delivery scope, 500-row omission and CSV formula neutralization via the actual download service. |

Cloud CI, persisted role revocation and browser privacy checks have not been run by this builder.
