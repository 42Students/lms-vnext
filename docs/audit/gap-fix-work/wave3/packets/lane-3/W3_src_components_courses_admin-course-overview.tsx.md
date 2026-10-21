# Work packet (wave 3): edit src/components/courses/admin-course-overview.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-courses.md

## G2-3-008-012  [P1] MISSING  facet F03  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:595-605`
- vNext now: `src/components/courses/admin-course-overview.tsx:525-528`
- Fix: College Admin legacy has row checkboxes with Show to students/Hide from students and selected count; new bulk visibility rendered only when courseBasePath starts /admin/. Restore college bulk selection/actions.

## G2-3-008-023  [P1] MISSING  facet F05  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:615-620`
- vNext now: `src/components/courses/admin-course-overview.tsx:525-538`
- Fix: Legacy persistent checkbox selection across pages+bulk actions, vNext college table no selection property; restore selection with cross-page persistence and failed-only retry.

## G2-3-008-048  [P1] MISSING  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:414-447`
- vNext now: `src/components/courses/admin-course-overview.tsx:525-528`
- Fix: Legacy bulkUpdateCourseStatus sends courseIds,active,enabled, receives partial failed array; vNext college excludes bulk action entirely.
