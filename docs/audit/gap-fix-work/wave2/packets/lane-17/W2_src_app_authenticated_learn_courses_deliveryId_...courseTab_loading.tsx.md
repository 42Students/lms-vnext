# Work packet (wave 2): edit src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/loading.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-courses-courseid-catchall.md

## G2-17-006-010  [P2] GAP  facet F03  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:136 uses tab-specific CourseTabSkeleton on first paint.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/loading.tsx:1-6 uses generic loading boundary (inspect implementation).
- Fix: Match shape-matched course-tab skeleton for each tab, rather than generic directory skeleton.

## G2-17-006-034  [P2] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:136 invokes CourseTabSkeleton tab={tab}; legacy component has distinct home, roadmap, attendanceDetail and discussion shapes.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/loading.tsx:1-6 generic.
- Fix: Render tab-aware skeleton geometry and correct labels in first paint.
