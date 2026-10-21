# Work packet (wave 2): edit src/app/(authenticated)/admin/semester-courses/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/semester-courses.md

## G2-12-002-055  [P2] GAP  facet F13  effort S
- Legacy: Mapping-specific 6-row skeleton and saving order indicator `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:385-405`
- vNext now: Route-level directory loading only `src/app/(authenticated)/admin/semester-courses/loading.tsx:1-6`
- Fix: Add mapping-specific loading state
