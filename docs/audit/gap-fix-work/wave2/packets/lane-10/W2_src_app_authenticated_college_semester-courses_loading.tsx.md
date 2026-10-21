# Work packet (wave 2): edit src/app/(authenticated)/college/semester-courses/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-17-002-061  [P2] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:395-397 TableSkeleton rows6/columns6 'Loading semester courses'.
- vNext now: src/app/(authenticated)/college/semester-courses/loading.tsx:1-3 generic directory GracefulPageLoading.
- Fix: Show six-column skeleton and exact loading name while fetching mappings.
