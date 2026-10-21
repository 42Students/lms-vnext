# Work packet: edit src/modules/placements/college-shortlisted-query.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md

## G2-9-014-005  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:110-118` — Deep links may preselect status via URL, default ASSESSMENT in shortlist mode.
- vNext now: `src/modules/placements/college-shortlisted-query.ts:3-15` — Only q/page deep-link options; no stage/status URL.
- Fix: Support URL status deep links and default ASSESSMENT.

## G2-9-014-024  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:128-138` — Source, Department, Program, Batch filters, plus search and clear filters.
- vNext now: `src/modules/placements/college-shortlisted-query.ts:3-15` — Only q/page accepted strict; source/department/program/batch omitted.
- Fix: Add all filters to URL, query and form.
