# Work packet: edit src/app/(authenticated)/college/semester-courses/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-17-002-062  [P1] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:387-390 failed refresh keeps last-good same-semester mappings, alert 'Couldn't refresh semester course mapping'.
- vNext now: src/app/(authenticated)/college/semester-courses/error.tsx:5-8 generic whole-page 'Course mappings unavailable'.
- Fix: Keep last-good per-term records during refresh failure and display stale-warning rather than blank whole page.
