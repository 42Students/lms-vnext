# Work packet (wave 2): edit src/app/(authenticated)/admin/layout.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-index.md, docs/audit/gap2/lane-3/superadmin-quizzes.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-6/superadmin-teachers.md

## G2-10-010-009  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/layouts/SuperAdminLayout.js:1-20` SuperAdminLayout provides shell only after target route loads
- vNext now: `src/app/(authenticated)/admin/layout.tsx:6-14` admin layout would render grouped tabs around /admin/academics
- Fix: Ensure root redirect does not expose academic tab strip before Overview landing

## G2-10-010-026  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:11-15` unconditional redirect; authorization occurs on destination layout
- vNext now: `src/app/(authenticated)/layout.tsx:52-68` authenticated layout resolves session/roles before nested redirect page; `src/app/(authenticated)/admin/layout.tsx:9-10` admin auth path
- Fix: Verify root landing never reveals academic content to non-Super Admin; preserve redirect for valid bookmarked users

## G2-10-010-028  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/layouts/SuperAdminLayout.js:105-110` legacy unauthorized link shows login without erasing other-role session
- vNext now: `src/app/(authenticated)/admin/layout.tsx:9-10` sends non Super Admin to /dashboard
- Fix: Ensure one bad bookmark does not log other users out

## G2-10-010-036  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Sidebar/SuperAdminSidebar.js:61-100` target dashboard uses responsive sidebar shell (separate ownership)
- vNext now: `src/app/(authenticated)/admin/layout.tsx:6-14` admin shell wraps nested target; wrong module changes phone navigation active state
- Fix: Check active-nav state at 375/768/1280 after redirect and use Dashboard target

## G2-3-004-027  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/layouts/SuperAdminLayout.js:43-74`; `docs/legacy-source/frontend/src/layouts/SuperAdminLayout.js:98-112`
- vNext now: `src/app/(authenticated)/admin/layout.tsx:6-14`; `src/app/(authenticated)/admin/quizzes/page.tsx:25-31`
- Fix: Legacy unauthorized login form/error toast in SuperAdminLayout; vNext redirects to dashboard at layout, page-level access error likely unreachable. Compare authentication UX.

## G2-4-007-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy `/superadmin/assignments` uses SuperAdminLayout and content group tabs. (`docs/legacy-source/frontend/src/pages/superadmin/assignments.js:2-5;docs/legacy-source/frontend/src/pages/superadmin/assignments.js:23-32`)
- vNext now: New `/admin/assignments` mounted under admin layout SuperAdminLegacyGroupTabs. (`src/app/(authenticated)/admin/assignments/page.tsx:15-35;src/app/(authenticated)/admin/layout.tsx:1-15`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-6-003-001  [P2] GAP  facet F01  effort S
- Legacy: Old route `/superadmin/teachers` wraps SuperAdminGroupShell people `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:23-32`
- vNext now: New route `/admin/faculty` under admin/layout `src/app/(authenticated)/admin/faculty/page.tsx:13-20` `src/app/(authenticated)/admin/layout.tsx:6-15`
- Fix: Add legacy URL redirect and retain people group active selection

## G2-6-003-005  [P2] GAP  facet F02  effort M
- Legacy: Old wrapper embeds PageShell title group and tabs above Faculty content `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:20-29` `docs/legacy-source/frontend/src/components/Common/PageShell.jsx:50-88`
- vNext now: New layout puts standalone tabs before nested AdminScopedReadPage PageHeader `src/app/(authenticated)/admin/layout.tsx:11-14` `src/app/(authenticated)/admin/faculty/page.tsx:20-34`
- Fix: Restore People group title hierarchy and same content padding

## G2-6-003-025  [P2] GAP  facet F11  effort S
- Legacy: Old SuperAdminLayout authorizes id=0 and denies other identities without clearing sessions `docs/legacy-source/frontend/src/layouts/SuperAdminLayout.js:58-72` `docs/legacy-source/frontend/src/layouts/SuperAdminLayout.js:129-140`
- vNext now: New admin layout redirects non-superadmin to dashboard `src/app/(authenticated)/admin/layout.tsx:8-12`
- Fix: Document changed denial destination and preserve legitimate other-role session

## G2-6-003-038  [P2] GAP  facet F17  effort M
- Legacy: Old SuperAdminLayout focuses routed main content on route navigation `docs/legacy-source/frontend/src/layouts/SuperAdminLayout.js:159-176`
- vNext now: New admin layout renders children and tabs without explicit focusing here `src/app/(authenticated)/admin/layout.tsx:8-15`
- Fix: Restore main-content focus on SPA transitions without scroll jump
