# Work packet: edit src/components/courses/college-quiz-actions.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md

## G2-3-001-043  [P1] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:385-392`
- vNext now: `src/components/courses/college-quiz-actions.tsx:26-41`
- Fix: When submissions exist, show modal `This quiz already has learner submissions` with count, metadata-only action, cancel; vNext edit lacks preflight explanation.

## G2-3-001-050  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:340-347`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:78-82`
- vNext now: `src/components/courses/college-quiz-actions.tsx:60-78`; `src/app/api/courses/quizzes/[quizId]/transition/route.ts:15-39`
- Fix: Clarify delete semantics: legacy DELETE, vNext ARCHIVE transition with retained rows/history; align user expectation and retention.

## G2-3-001-055  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:367-390`
- vNext now: `src/components/courses/college-quiz-actions.tsx:47-59`; `src/modules/courses/quiz-validation.ts:175-210`
- Fix: Legacy allows title/description edits after attempts and locks deadline/attempts/randomization; vNext UI offers deadline and stale-version logic; verify server restrictions.

## G2-3-001-079  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:287-318`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:364-405`
- vNext now: `src/components/courses/college-quiz-actions.tsx:20-41`; `src/components/courses/college-quiz-create.tsx:74-95`
- Fix: Ensure all publish/results/delete/edit actions are guarded against concurrent double-submission and stale college scope; vNext guards editor/create differently.

## G2-3-001-080  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:9-14`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:225-259`
- vNext now: `src/components/courses/college-quiz-create.tsx:69-72`; `src/components/courses/college-quiz-actions.tsx:13-17`
- Fix: Audit IST wall-clock ↔ UTC offsets, DST-independent parsing, seconds stripping and late comparisons end-to-end.

## G2-3-001-081  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:381-401`
- vNext now: `src/components/courses/college-quiz-actions.tsx:30-41`; `src/app/api/courses/quizzes/[quizId]/route.ts:16-35`
- Fix: On failed attempt-count precheck, allow only metadata correction and show exact warning; vNext fetches metadata without attempt-count precheck.

## G2-3-005-008  [P1] GAP  facet F03  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:476-485`
- vNext now: `src/components/courses/college-quiz-actions.tsx:60-80`
- Fix: Old Delete permanently deletes quiz but new Archive retains history; resolve intended lifecycle explicitly.

## G2-3-005-032  [P1] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:375-405`
- vNext now: `src/components/courses/college-quiz-actions.tsx:40-58`
- Fix: Attempt-count preflight must permit metadata-only edits after submissions, never full question edit; fallback on count failure.

## G2-3-005-055  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:287-319`
- vNext now: `src/components/courses/college-quiz-actions.tsx:26-81`
- Fix: Per-record mutation locks and disabled edit/publish/delete while pending must be comparable.

## G2-3-001-037  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:308-328`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:274-283`
- vNext now: `src/components/courses/college-quiz-create.tsx:88-95`; `src/components/courses/college-quiz-actions.tsx:64-79`
- Fix: Use exact `Quiz was not created`/`Quiz changes were not saved` and retry guidance with field errors.

## G2-3-001-039  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:321-347`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:294-299`
- vNext now: `src/components/courses/college-quiz-actions.tsx:74-79`; `src/components/courses/admin-learning-structure-actions.tsx:659-685`
- Fix: Reconcile exact success texts: `Quiz published`, `Quiz deleted`, `Results released to learners` or `Results withheld from learners`.

## G2-3-005-029  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:321-347`
- vNext now: `src/components/courses/college-quiz-actions.tsx:26-81`
- Fix: Restore exact Quiz published / Quiz deleted success texts and per-row failed-action Retry.
