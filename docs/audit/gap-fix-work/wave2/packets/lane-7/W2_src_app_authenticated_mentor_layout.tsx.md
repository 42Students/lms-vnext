# Work packet (wave 2): edit src/app/(authenticated)/mentor/layout.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/mentor-course-redirect.md

## G2-12-004-014  [P2] GAP  facet F11  effort S
- Legacy: Legacy redirect executes before any page-specific role/access checks `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-12`
- vNext now: Mentor layout requires MENTOR role before rendering redirect child `src/app/(authenticated)/mentor/layout.tsx:10-22`
- Fix: Verify compatibility URL doesn't alter permissible redirect for unauthorized role
