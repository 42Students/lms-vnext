# Work packet (wave 2): edit src/modules/academics/college-structure-directory-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/elective-admin-controller.md, docs/audit/gap2/lane-5/u003-college-admin-classes.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-4-024-002  [P2] GAP  facet F01  effort M
- Legacy: Slots available GET /slots with programId, semester, includeArchived=false defaults (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:81-87`)
- vNext now: New electives directory uses URL filters and paged directory read (`src/app/(authenticated)/college/electives/page.tsx:31-43`; `src/modules/academics/college-structure-directory-service.ts:25-38`)
- Fix: Map includeArchived, semester and program default filter semantics.

## G2-5-003-018  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: Toolbar search class, program, batch, capacity, description; updates on type. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:468-470; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:219-228)
- vNext now: Search registered records, max100, submit Filter, SQL matches name/code/batch/program/description/capacity. (src/components/academics/college-structure-directory.tsx:51-57; src/modules/academics/college-structure-directory-service.ts:110-117)
- Fix: Match placeholder and instant search; keep server-side scalability.

## G2-9-007-067  [P2] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:48-87` — Request sequence suppresses stale full-list and lookup responses, 20/page
- vNext now: `src/modules/academics/college-structure-directory-service.ts:233-239` — Server filtered paging limit/offset with default 10
- Fix: Align declared page size and preserve deterministic sorting
