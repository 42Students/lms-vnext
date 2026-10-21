# Work packet: edit src/app/(authenticated)/admin/semester-courses/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-12-002-004  [P1] GAP  facet F02  effort M
- Legacy: Header then lg=10/14 two-panel mapping workspace `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:327-335,379-409`
- vNext now: Editor under closed details, directory primary `src/app/(authenticated)/admin/semester-courses/page.tsx:35-49`
- Fix: Open editor by default and clone two-column card layout

## G2-17-002-003  [P1] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:327-335 leads immediately with editable mapping two-card UI.
- vNext now: src/app/(authenticated)/admin/semester-courses/page.tsx:35-49 collapses editor under details and elevates status/search/export directory.
- Fix: Make editable curriculum mapping the primary superadmin view rather than hidden disclosure.
