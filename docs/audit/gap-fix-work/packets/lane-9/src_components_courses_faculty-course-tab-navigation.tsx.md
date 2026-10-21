# Work packet: edit src/components/courses/faculty-course-tab-navigation.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-004  [P1] GAP  facet F01  effort M
- Legacy: `?cls=<numeric-class-id>` selects authorized class and canonicalizes a stale class selection. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:67-82`, `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:23-47`
- vNext now: Section selector uses delivery UUID; students/attendance accept `cls` only when it matches section or delivery UUID, not legacy numeric class ID. `src/components/courses/faculty-course-tab-navigation.tsx:53-66`, `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:17-26`, `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:24-34`
- Fix: Introduce legacy numeric-class map with tenant/teacher authorization and redirect; do not silently show an unrelated section.

## G2-18-001-093  [P1] GAP  facet F20  effort M
- Legacy: Legacy checks cancellation and sequence to ignore out-of-order assignment refresh, clears cached roster on failure. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:145-156`, `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:184-203`
- vNext now: vNext navigations use server snapshots refreshed every minute with authorized DB queries. `src/components/courses/faculty-course-tab-navigation.tsx:29-42`, `src/modules/courses/faculty-course-service.ts:103-195`
- Fix: Ensure a failed periodic refresh never leaves stale confidential roster visibly accessible; consider route-level error reset on revoked access.
