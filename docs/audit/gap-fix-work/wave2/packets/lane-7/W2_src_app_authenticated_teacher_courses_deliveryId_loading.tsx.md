# Work packet (wave 2): edit src/app/(authenticated)/teacher/courses/[deliveryId]/loading.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/teacher-courses-courseid-index.md

## G2-17-001-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:16-21 displays FacultyOverviewSkeleton while transitioning; docs/legacy-source/frontend/src/components/Course/Common/CourseTabSkeleton.jsx:127-152 stages about, command bar, four priority cards.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/loading.tsx:1-4 returns GracefulPageLoading directory; src/components/ui/graceful-page-loading.tsx:14-25 renders line/form/rows rather than faculty overview geometry.
- Fix: Use the faculty overview placeholder on the default redirect/loading boundary; match section order and dimensions.

## G2-17-001-027  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:20-21 shows faculty-shaped loading immediately; docs/legacy-source/frontend/src/components/Course/Common/CourseTabSkeleton.jsx:168-175 uses aria-label 'Loading course'.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/loading.tsx:4 generic 'Loading Faculty course…'; src/components/ui/graceful-page-loading.tsx:14-30 shows directory skeleton and slow-load Retry.
- Fix: Match loading geometry, labels, and transition; keep retry as deliberate vNext enhancement after slow threshold.

## G2-17-001-035  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:60-65 says 'Course', 'Course workspace', 'Back to courses'; docs/legacy-source/frontend/src/components/Course/Common/CourseTabSkeleton.jsx:170 says 'Loading course'.
- vNext now: src/components/courses/faculty-course-workspace.tsx:384-387 names actual course with code/section/period; src/app/(authenticated)/teacher/courses/[deliveryId]/loading.tsx:4 says 'Loading Faculty course…'.
- Fix: Use legacy copy for shell/loading labels or document product-approved exceptions; compare old copy catalogue course page closure.
