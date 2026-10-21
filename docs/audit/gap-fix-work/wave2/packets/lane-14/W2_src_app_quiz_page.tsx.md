# Work packet (wave 2): edit src/app/quiz/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/learner-quiz.md

## G2-3-003-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/quiz.js:74-110`
- vNext now: `src/app/quiz/page.tsx:1-25`
- Fix: The legacy /quiz is explicitly nolayout and renders full-height `bg-gray` quiz surface; new white max-w-6xl framed card and breadcrumb-style `← All Quizzes` link create a different shell. Align shell structure and width if strict parity.

## G2-3-003-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/quiz.js:93-98`
- vNext now: `src/app/quiz/page.tsx:1-25`
- Fix: Restore document title `42Learn <-> Quiz`, explicit viewport-fit=cover metadata and favicon if absent in parent metadata.

## G2-3-003-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/leftpanel.js:15-45`
- vNext now: `src/app/quiz/page.tsx:10-15`; `src/components/courses/learner-quiz-attempt.tsx:471-490`
- Fix: Legacy status rail has 130×40 logo linked or cancel-button role-specifically; vNext uses textual All Quizzes outside the rail, no logo. Restore logo and role semantics if strict clone.
