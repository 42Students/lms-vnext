# Work packet: edit src/app/(authenticated)/mentor/courses/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/mentor-course-redirect.md

## G2-12-004-001  [P1] MISSING  facet F01  effort S
- Legacy: Legacy dynamic bookmark `/mentor/courses/:courseId` always redirects to `/mentor/projects` `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-7`
- vNext now: Only `/mentor/courses` index redirect exists; dynamic `[courseId]` route absent, falls through mentor 404 `src/app/(authenticated)/mentor/courses/page.tsx:1-7`
- Fix: Add dynamic route redirect to `/mentor/projects` regardless of id

## G2-12-004-012  [P1] GAP  facet F10  effort S
- Legacy: SSR redirect issued by getServerSideProps with permanent:false `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-7`
- vNext now: App Router redirect only for index, not dynamic path `src/app/(authenticated)/mentor/courses/page.tsx:1-6`
- Fix: Implement Next redirect in dynamic route with temporary semantics

## G2-12-004-030  [P1] GAP  facet F23  effort S
- Legacy: Legacy redirects from a defunct mentor Courses area to Projects `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-7`
- vNext now: VNext redirect kept for `/mentor/courses` but not nested courseId `src/app/(authenticated)/mentor/courses/page.tsx:3-6`
- Fix: Retain both index and dynamic bookmark aliases
