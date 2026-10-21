# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/submissions/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-projects-submissions.md

## G2-4-009-001  [P2] GAP  facet F01  effort M
- Legacy: `/superadmin/projects/submissions` under SuperAdminLayout and Projects group tabs. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:1-8;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:576-599`)
- vNext now: New route `/admin/projects/submissions`, ProjectAdminNav active submissions plus back link. (`src/app/(authenticated)/admin/projects/submissions/page.tsx:11-59;src/components/projects/project-admin-submissions-page.tsx:117-140`)
- Fix: Align old behavior and wording unless this difference is approved.

## G2-4-009-002  [P2] GAP  facet F01  effort M
- Legacy: No selectedCollegeId renders group tabs, Alert `No college selected` with `Pick a college in the header to view its submissions.` and Skeleton while scope loading. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:576-595`)
- vNext now: New shows `Select a college scope`, description `Choose a college before reviewing project submissions.` without loading skeleton. (`src/app/(authenticated)/admin/projects/submissions/page.tsx:34-48`)
- Fix: Use old no-scope title/description and loaded vs loading state.
