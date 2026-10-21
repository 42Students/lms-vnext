# Work packet: edit src/app/(authenticated)/learn/allQuizzes/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/learner-all-quizzes.md

## G2-8-007-021  [P2] GAP  facet F07  effort M
- Legacy: refresh error shows last loaded rows plus warning Retry (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:598-614`)
- vNext now: new SSR page + general Next error boundary, no inline partial stale-row state (`src/app/(authenticated)/learn/allQuizzes/page.tsx:9-14`)
- Fix: Keep last good list on failed refresh when safe, give clear Retry and warning

## G2-8-007-022  [P2] GAP  facet F07  effort S
- Legacy: API list errors title Failed to load quizzes. Please try again. (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:506-513`)
- vNext now: no corresponding inline list failure text on initial server page (`src/app/(authenticated)/learn/allQuizzes/page.tsx:9-14`)
- Fix: Map fetch error to same explanatory copy instead of opaque boundary failure
