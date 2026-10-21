# Work packet: edit src/app/(authenticated)/teacher/allQuizzes/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-all-quizzes.md

## G2-3-006-025  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:603-614`
- vNext now: `src/app/(authenticated)/teacher/allQuizzes/error.tsx:14-25`
- Fix: Legacy failed-refresh warning retains last loaded quizzes and Retry; new server error boundary cannot show prior rows.
