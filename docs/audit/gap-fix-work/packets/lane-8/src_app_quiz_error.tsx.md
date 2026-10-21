# Work packet: edit src/app/quiz/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/learner-quiz.md

## G2-3-003-023  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/quiz.js:35-62`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:348-357`; `src/app/quiz/error.tsx:1-11`
- Fix: Legacy boundary shows exact `Something went wrong`, explanatory paragraph plus `Try Again`, `Refresh page`, `Back to quizzes`; vNext load error omits Refresh page and changes back label.
