# Work packet (wave 2): edit src/modules/courses/admin-course-workspace.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-courses.md

## G2-3-008-070  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:148-180`
- vNext now: `src/modules/courses/admin-course-workspace.ts:11-38`; `src/modules/courses/college-course-catalogue-service.ts:39-65`
- Fix: Legacy one unbounded getCoursesByCollege + client pagination, vNext full multi-relation workspace plus paginated SQL second query; benchmark number of DB joins.
