# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/[projectId]/page.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-20/super-admin-workspace-index.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md

## G2-2-020-036  [P2] GAP  facet F10  effort M
- Legacy: AdminProjectController.java:141-147 resolves project by numeric ID or slug
- vNext now: src/app/(authenticated)/admin/projects/[projectId]/page.tsx:21-29 accepts UUID only
- Fix: Support legacy deep-link redirects by slug/ID or document no-migration policy.

## G2-20-028-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy index forward summary docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:6-22
- vNext now: New different route summary src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-29
- Fix: Alias route

## G2-20-028-002  [P2] GAP  facet F02  effort S
- Legacy: Old skeleton six rows docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:26-30
- vNext now: New no markup src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30
- Fix: Loading fallback

## G2-20-028-003  [P2] MISSING  facet F03  effort S
- Legacy: Old AntD active skeleton docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:3,26-29
- vNext now: New nothing src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30
- Fix: Shimmer

## G2-20-028-004  [P2] GAP  facet F04  effort M
- Legacy: Dynamic workspaceId arbitrary docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:14-20
- vNext now: New requires UUID src/app/(authenticated)/admin/projects/[projectId]/page.tsx:21-24
- Fix: ID mapping

## G2-20-028-012  [P2] GAP  facet F12  effort M
- Legacy: Old encoded workspaceId docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:19-22
- vNext now: New parsed UUID src/app/(authenticated)/admin/projects/[projectId]/page.tsx:21-28
- Fix: Map IDs

## G2-20-028-013  [P2] MISSING  facet F13  effort S
- Legacy: Old skeleton pending docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:17-30
- vNext now: No loading state src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30
- Fix: Loading UI

## G2-20-028-018  [P2] GAP  facet F18  effort S
- Legacy: Summary deep link docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:8-22
- vNext now: New summary path differs src/app/(authenticated)/admin/projects/[projectId]/page.tsx:25-29
- Fix: Link copy

## G2-20-028-022  [P2] GAP  facet F22  effort M
- Legacy: No legacy DB docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:13-31
- vNext now: New UUID parse src/app/(authenticated)/admin/projects/[projectId]/page.tsx:21-24
- Fix: Old key compatibility

## G2-4-029-035  [P2] GAP  facet F11  effort S
- Legacy: Uses Super Admin selectedCollegeId; no scope → No college selected (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:15-18`)
- vNext now: Requires isSuperAdmin and requireProjectManageAccess before redirect (`src/app/(authenticated)/admin/projects/[projectId]/page.tsx:17-25`)
- Fix: Preserve explicit college-picker recovery without leaking foreign data.

## G2-4-029-041  [P2] GAP  facet F13  effort S
- Legacy: Missing scope skeleton while loading; warning after scope loaded (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:47-63`)
- vNext now: Access-checked redirect, no recovery skeleton (`src/app/(authenticated)/admin/projects/[projectId]/page.tsx:17-29`)
- Fix: Provide explicit no-college state with tabs and skeleton.

## G2-14-028-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy /superadmin/projects/workspaces/{id}/summary under SuperAdminWorkspaceShell. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:83-89,405-411`
- vNext now: vNext /admin/projects/{UUID}/summary after guarded redirect, canonical ProjectWorkspace. `src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-29`, `src/components/projects/admin-project-section-page.tsx:19-74`
- Fix: Map deep links and old numeric IDs.

## G2-20-028-016  [P3] GAP  facet F16  effort S
- Legacy: Legacy module class docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:26-30
- vNext now: New no CSS src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30
- Fix: Spacing

## G2-20-028-017  [P3] GAP  facet F17  effort S
- Legacy: Old skeleton no ARIA docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:26-30
- vNext now: New blank src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30
- Fix: Status label
