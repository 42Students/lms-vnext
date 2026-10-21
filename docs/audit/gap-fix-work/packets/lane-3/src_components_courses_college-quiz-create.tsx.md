# Work packet: edit src/components/courses/college-quiz-create.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md, docs/audit/gap2/lane-3/superadmin-quizzes.md

## G2-3-001-027  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:348-380`
- vNext now: `src/components/courses/college-quiz-create.tsx:122-124`
- Fix: Make due date required at creation and retain 5-minute time-step/date-disabled constraints; current draft form accepts blank due.

## G2-3-001-030  [P1] GAP  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:413-415`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:250-253`
- vNext now: `src/components/courses/college-quiz-create.tsx:77-93`
- Fix: Restore `Publish now` toggle default on: legacy create could publish immediately; vNext always creates draft and needs separate action.

## G2-3-001-033  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:206-223`
- vNext now: `src/components/courses/college-quiz-create.tsx:197-207`
- Fix: Restore beforeunload/route-change dirty guard while editing; inline vNext only confirms Cancel.

## G2-3-001-034  [P1] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:346-347`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizUpsertRequestDTO.java:19-25`
- vNext now: `src/components/courses/college-quiz-create.tsx:119-130`; `src/modules/courses/quiz-validation.ts:15-25`
- Fix: Enforce legacy 5000-char description max or formally approve 10000-char new limit; distinguish UI and server validation.

## G2-3-001-047  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:7-8`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:243-272`
- vNext now: `src/components/courses/college-quiz-create.tsx:74-95`; `src/app/api/courses/quizzes/route.ts:32-56`
- Fix: Support legacy create `publish=true` server-side or explicitly document intentional two-step publish rollout.

## G2-3-001-079  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:287-318`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:364-405`
- vNext now: `src/components/courses/college-quiz-actions.tsx:20-41`; `src/components/courses/college-quiz-create.tsx:74-95`
- Fix: Ensure all publish/results/delete/edit actions are guarded against concurrent double-submission and stale college scope; vNext guards editor/create differently.

## G2-3-001-080  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:9-14`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:225-259`
- vNext now: `src/components/courses/college-quiz-create.tsx:69-72`; `src/components/courses/college-quiz-actions.tsx:13-17`
- Fix: Audit IST wall-clock ↔ UTC offsets, DST-independent parsing, seconds stripping and late comparisons end-to-end.

## G2-3-005-020  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:348-380`
- vNext now: `src/components/courses/college-quiz-create.tsx:122-130`
- Fix: Require future due date, 5-minute increments, past day restriction; new form accepts blank due.

## G2-3-005-025  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:206-223`
- vNext now: `src/components/courses/college-quiz-create.tsx:195-208`
- Fix: Restore beforeunload/route-change dirty guard to prevent lost quiz edits.

## G2-3-005-041  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:352-390`
- vNext now: `src/components/courses/college-quiz-create.tsx:119-130`
- Fix: After attempts, lock deadline/attempt limit/questions/randomization; allow only title and description corrections.

## G2-3-004-017  [P1] GAP  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:554-560`
- vNext now: `src/components/courses/college-quiz-create.tsx:105-205`
- Fix: Legacy opens modal builder, has publish-now and date required; vNext inline creator defaults draft and optional date. Restore authoring parity for Super Admin.

## G2-3-001-036  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:345-346`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:357-369`
- vNext now: `src/components/courses/college-quiz-create.tsx:52-72`
- Fix: Display field-level `Enter a quiz title`/`Set a due date`/future-date errors, not only single banner strings.

## G2-3-001-037  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:308-328`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:274-283`
- vNext now: `src/components/courses/college-quiz-create.tsx:88-95`; `src/components/courses/college-quiz-actions.tsx:64-79`
- Fix: Use exact `Quiz was not created`/`Quiz changes were not saved` and retry guidance with field errors.

## G2-3-001-040  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:260-272`
- vNext now: `src/components/courses/college-quiz-create.tsx:90-94`
- Fix: Restore created + published/draft toast wording; current `Quiz draft created. Publish it when the questions are ready.` is not identical.

## G2-3-001-041  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:212-223`
- vNext now: `src/components/courses/college-quiz-create.tsx:198-206`
- Fix: Use precise discard confirmation heading, `Your unsaved changes will be lost.`, and `Discard`/`Keep editing` actions.
