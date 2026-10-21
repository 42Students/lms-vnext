# Work packet (wave 2): edit src/modules/admin-ui/super-admin-learning-csv-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-quizzes-section.md, docs/audit/gap2/lane-3/superadmin-quizzes.md

## G2-3-005-037  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:265-285`
- vNext now: `src/modules/admin-ui/super-admin-learning-csv-service.ts:29-61`
- Fix: Legacy current-page 5-column CSV filename embeds college+page; new 500-record all-filter export has 13 fields/truncation.

## G2-3-005-045  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:265-285`
- vNext now: `src/modules/admin-ui/super-admin-learning-csv-service.ts:29-61`
- Fix: Provide current-page CSV with exact Title Course Status Points Due columns; expanded export must be separately labeled.

## G2-3-004-034  [P2] GAP  facet F14  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:267-285`
- vNext now: `src/modules/admin-ui/super-admin-learning-csv-service.ts:29-61`
- Fix: Reconcile `quizzes-college-{id}-page-{n}.csv` and five visible columns to current `quiz.csv` 13-column all-filter export.
