# Work packet (wave 2): edit src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-013  [P2] GAP  facet F02  effort S
- Legacy: Legacy Discussion contains subtitle, pinned strip, feed, new message chip, composer all in shared canvas. `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:557-673`
- vNext now: vNext inserts separate PageHeader and back action before comparable discussion component. `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx:20-33`, `src/components/courses/learner-course-discussion.tsx:396-462`
- Fix: Avoid duplicate page heading and preserve pinned-strip/feed/composer vertical hierarchy.

## G2-18-001-087  [P3] GAP  facet F18  effort S
- Legacy: Legacy discussion subtitle `Keep course conversations in one place and follow along easily.` `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:559-564`
- vNext now: vNext description displays course name and section and additional discussion guidance. `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx:22-27`, `src/components/courses/learner-course-discussion.tsx:396-405`
- Fix: Restore subtitle and relocate scoping to helper/breadcrumb.
