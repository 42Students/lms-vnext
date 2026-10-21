# Work packet (wave 2): edit src/app/(authenticated)/mentor/courses/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/mentor-course-redirect.md

## G2-12-004-002  [P2] GAP  facet F01  effort S
- Legacy: Target always project workspace, not mentor home `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:4`
- vNext now: Index redirects to `/mentor`; landing conditionally redirects to projects `src/app/(authenticated)/mentor/courses/page.tsx:4-5`
- Fix: For legacy deep link target projects directly

## G2-12-004-013  [P2] GAP  facet F10  effort S
- Legacy: Destination path literal `/mentor/projects` `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:4`
- vNext now: Index destination literal `/mentor` `src/app/(authenticated)/mentor/courses/page.tsx:4-5`
- Fix: Set destination to exact legacy path
