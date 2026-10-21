# Work packet (wave 2): edit src/modules/courses/learner-course-preferred-period-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u006-learner-courses.md

## G2-15-006-069  [P2] GAP  facet F22  effort M
- Legacy: Legacy academic-year/semester selected by backend.currentSemester; course credit data can be invalid (CoursesContent.jsx:292-307,302-306)
- vNext now: VNext academicPeriods startDate/status and typed credits/period, preferred non-readonly (learner-course-service.ts:101-121; learner-course-preferred-period-model.ts:3-13)
- Fix: Define transition of current semester and credit validation at migration/schema boundaries
