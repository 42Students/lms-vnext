# Work packet (wave 2): edit src/app/(authenticated)/teacher/allQuizzes/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-all-quizzes.md

## G2-3-006-041  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:601-614`; `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:707-718`
- vNext now: `src/app/(authenticated)/teacher/allQuizzes/loading.tsx:1-5`; `src/app/(authenticated)/teacher/allQuizzes/error.tsx:14-25`
- Fix: Legacy four skeleton rows on load plus same-page refresh status/error; vNext global GracefulPageLoading and error route replace page.
