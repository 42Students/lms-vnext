# Work packet (wave 2): edit src/app/(authenticated)/learn/allQuizzes/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md, docs/audit/gap2/lane-8/learner-all-quizzes.md

## G2-15-031-015  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:14-42`
- vNext now: `src/app/(authenticated)/learn/allQuizzes/page.tsx:45-55`
- Fix: Legacy Quiztable and Redux builder vs overview and attempts/status fields.

## G2-8-007-002  [P2] GAP  facet F01  effort M
- Legacy: one shared QuizzesContent branches on loginUser.userType===FACULTY (`docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:16-20`)
- vNext now: learner quiz page only; teacher quiz is a separate faculty route (`src/app/(authenticated)/learn/allQuizzes/page.tsx:9-18`)
- Fix: Ensure the old shared component route under faculty redirects to appropriate teacher list

## G2-8-007-003  [P2] GAP  facet F02  effort M
- Legacy: PageShell encloses ListingPageHeader inside learn-quizzes-page--placements (`docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:197-310`)
- vNext now: PageHeader then LearnerAssessmentOverview without inner PageShell wrapper (`src/app/(authenticated)/learn/allQuizzes/page.tsx:44-58`)
- Fix: Align outer white card and top margin of quiz list to legacy while avoiding duplicate shells

## G2-8-007-031  [P2] GAP  facet F12  effort M
- Legacy: submitted detected if flag, attemptCount>0 or latestScore non-null (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:260-265`)
- vNext now: attemptsUsed and progressStatus derived from persisted quiz attempts (`src/app/(authenticated)/learn/allQuizzes/page.tsx:32-42`)
- Fix: Reconcile mixed historical submitted flag semantics into canonical attempt count

## G2-8-007-048  [P2] MISSING  facet F20  effort M
- Legacy: legacy content query opens matching submissions modal on load (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:79-80,480-486`)
- vNext now: new page only accepts course search param (`src/app/(authenticated)/learn/allQuizzes/page.tsx:9-14`)
- Fix: Support legacy ?content quiz deep links to history/modal route
