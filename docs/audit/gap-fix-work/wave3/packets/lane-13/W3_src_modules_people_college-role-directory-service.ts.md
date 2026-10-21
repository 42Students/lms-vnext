# Work packet (wave 3): edit src/modules/people/college-role-directory-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-6-001-070  [P1] MISSING  facet F21  effort L
- Legacy: Old popular search and selection tracking use distinct FacultySearchService endpoints `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:153-160` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:291-316`
- vNext now: New directory SQL search only `src/modules/people/college-role-directory-service.ts:262-280`
- Fix: Restore scoped popularity/recent integration if still required
