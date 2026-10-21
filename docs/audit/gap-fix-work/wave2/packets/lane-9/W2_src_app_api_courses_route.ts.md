# Work packet (wave 2): edit src/app/api/courses/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-18-003-060  [P2] GAP  facet F10  effort M
- Legacy: Legacy POST createCourse with metadata, active/enabled and selected dept, then refresh. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:255-305`
- vNext now: vNext POST `/api/courses` with departmentId/name/code/shortTitle etc; default ACTIVE. `src/app/api/courses/route.ts:30-51`, `src/modules/courses/validation.ts:28-45`
- Fix: Bridge name/shortTitle/metadata/visibility semantics and suppress duplicate creation on failed upload.
