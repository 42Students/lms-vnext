# Work packet (wave 2): edit src/app/quiz/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/learner-quiz.md

## G2-3-003-045  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/quiz.js:18-31`
- vNext now: `src/app/quiz/error.tsx:3-11`
- Fix: Legacy boundary resets on changes in quizId/review/embed/asPath; vNext route error boundary uses generic reset and no explicit query reset key. Confirm stale error recovery on route changes.
