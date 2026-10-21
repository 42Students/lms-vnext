# Work packet (wave 3): edit src/components/admin/learner-module-access-drawer.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md

## G2-10-019-034  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:327-350 — Clear legacy lock without stored value at learner scope.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:90-98 — No lock-only repair button in drawer.
- Fix: Add special lock-only repair action with Super Admin permission.

## G2-10-019-052  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:231-247; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:149-169 — GET learner-overrides collegeId in independent request.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:29-44 — GET /api/admin/features/:collegeId/trace only on query; no roster endpoint.
- Fix: Add college-specific override roster/lock audit endpoint.
