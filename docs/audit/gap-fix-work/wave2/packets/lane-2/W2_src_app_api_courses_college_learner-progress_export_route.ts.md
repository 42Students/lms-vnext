# Work packet (wave 2): edit src/app/api/courses/college/learner-progress/export/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-progress-controller.md, docs/audit/gap2/lane-8/college-course-progress.md

## G2-2-015-042  [P2] GAP  facet F14  effort S
- Legacy: legacy export filename course-progress-courseId-class-classId.csv with learnerId/name/roll/attempt counts/percent (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:207-225`)
- vNext now: vNext export filename college-learner-course-progress.csv with similar plus Completed/Items measured (`src/app/api/courses/college/learner-progress/export/route.ts:19-38`)
- Fix: Keep contextual filename/column headers and order, document extra columns

## G2-8-008-042  [P2] GAP  facet F14  effort S
- Legacy: legacy export filename course-progress-courseId-class-classId.csv with learnerId/name/roll/attempt counts/percent (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:207-225`)
- vNext now: vNext export filename college-learner-course-progress.csv with similar plus Completed/Items measured (`src/app/api/courses/college/learner-progress/export/route.ts:19-38`)
- Fix: Keep contextual filename/column headers and order, document extra columns
