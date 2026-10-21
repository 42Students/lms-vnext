# Work packet: edit src/modules/courses/college-assessment-export-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-004-072  [P1] GAP  facet F14  effort M
- Legacy: `Export CSV (page)` only currently displayed 20 rows, filename `assignments-college-ID-page-P.csv`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- vNext now: vNext Export CSV endpoint cap1000 and full filtered export, not page; different filename and schema. (`src/components/courses/college-assessment-aggregate.tsx:85-90; src/modules/courses/college-assessment-export-model.ts:4-20`)
- Fix: Offer exact current-page export with legacy columns and filename; keep full-filter export as separately labeled option.

## G2-4-010-072  [P1] GAP  facet F14  effort M
- Legacy: `Export CSV (page)` only currently displayed 20 rows, filename `assignments-college-ID-page-P.csv`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- vNext now: vNext Export CSV endpoint cap1000 and full filtered export, not page; different filename and schema. (`src/components/courses/college-assessment-aggregate.tsx:85-90; src/modules/courses/college-assessment-export-model.ts:4-20`)
- Fix: Offer exact current-page export with legacy columns and filename; keep full-filter export as separately labeled option.
