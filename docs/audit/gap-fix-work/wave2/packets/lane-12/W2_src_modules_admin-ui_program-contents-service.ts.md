# Work packet (wave 2): edit src/modules/admin-ui/program-contents-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/superadmin-sections-programs.md

## G2-20-029-043  [P3] GAP  facet F10  effort M
- Legacy: Legacy reads GET new-program/fetchByCollege and department-by-college plus 3 dependency GETs per row (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:66-109`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:161-168`, `docs/legacy-source/frontend/src/api/Services/AdminService.js:117-135`)
- vNext now: vNext uses server-rendered listPrograms/listDepartments/listProgramContents in 2 query rounds (`src/app/(authenticated)/admin/programs/page.tsx:37-46`, `src/modules/admin-ui/program-contents-service.ts:20-63`)
- Fix: Record old-to-new endpoint mapping; preserve scope and retry semantics
