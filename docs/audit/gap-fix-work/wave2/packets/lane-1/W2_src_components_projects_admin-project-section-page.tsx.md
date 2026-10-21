# Work packet (wave 2): edit src/components/projects/admin-project-section-page.tsx

36 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u028-superadmin-workspace-overview.md, docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md, docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md, docs/audit/gap2/lane-3/superadmin-workspace-delivery.md, docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md

## G2-18-028-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy back button computed from from param, breadcrumb included; SuperAdminWorkspaceShell.jsx:13-27
- vNext now: New back target only workspaces/at-risk/submissions; src/components/projects/admin-project-section-page.tsx:49-56
- Fix: Restore exact breadcrumb/back target and labels

## G2-18-028-031  [P2] GAP  facet F13  effort M
- Legacy: Old no-college skeleton rows4, loading skeleton rows6, load-error Retry, not-found banner; overview.js:107-145
- vNext now: New route-level loading/error/404 and server fetch; admin-project-section-page.tsx:34-47
- Fix: Show contextual recovery with tabs, no false not-found before load

## G2-16-028-002  [P2] GAP  facet F01  effort M
- Legacy: SuperAdminWorkspaceShell.jsx:14-29 supplies section tabs and Back to projects/at-risk source.
- vNext now: admin-project-section-page.tsx:22-59 provides generic projects back target, preserving only `at-risk` and `submissions`.
- Fix: Preserve workspace-specific tab labels/back behavior, and supported deep link source variants.

## G2-16-028-034  [P2] GAP  facet F13  effort M
- Legacy: resources.js:69-113 missing college warning, scoped-loading skeleton 4/6 rows, error alert with Retry, Workspace not found warning.
- vNext now: admin-project-section-page.tsx:27-38 throws notFound or access failure; generic route-level loading/error.
- Fix: Add the same four recoverable states within workspace tabs with Retry.

## G2-13-028-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:78-97 missing selected college keeps project tabs with warning
- vNext now: src/components/projects/admin-project-section-page.tsx:38-47 requires manage scope and workspace fetch
- Fix: Render recoverable choose-college state rather than generic denial.

## G2-13-028-040  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:78-97 no selected scope warning rather than redirect
- vNext now: src/components/projects/admin-project-section-page.tsx:38-47 throws without scope recovery
- Fix: Provide recoverable missing-college notice keeping tab strip.

## G2-13-028-044  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:78-97 no selected scope vs scope loading skeleton
- vNext now: src/components/projects/admin-project-section-page.tsx:38-47 server scope fetch without equivalent skeleton
- Fix: Restore scope-loading placeholder and choose-college warning.

## G2-13-028-045  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:106-125 error Retry,skeleton6 rows,not-found warning
- vNext now: src/components/projects/admin-project-section-page.tsx:34-47 notFound on invalid section and workspace error
- Fix: Distinguish unavailable workspace from network error and not-found.

## G2-13-028-062  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:8 AdminService.updateProject then reload
- vNext now: src/components/projects/admin-project-section-page.tsx:38-47 RequestContext+workspace-view-service
- Fix: Map legacy admin task mutation pipeline to new project task write API.

## G2-3-029-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:17-36`
- vNext now: `src/components/projects/admin-project-section-page.tsx:38-47`
- Fix: Legacy empty college scope renders No college selected inside full tabs/shell; vNext relies on permission check and lacks same recovery card.

## G2-3-029-014  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:45-53`
- vNext now: `src/components/projects/admin-project-section-page.tsx:38-47`
- Fix: Legacy error callout Workspace could not be loaded with inline Retry button; vNext RSC error boundary rather than inline retry.

## G2-3-029-023  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:13-15`
- vNext now: `src/components/projects/admin-project-section-page.tsx:34-47`
- Fix: Legacy undefined workspaceId shows skeleton until router hydration; vNext route requires parsed section/project ID and can immediate 404.

## G2-3-029-029  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:46-46`
- vNext now: `src/components/projects/admin-project-section-page.tsx:49-56`
- Fix: Legacy Retry button triggers same workspace fetch; vNext dedicated error route refresh may remount entire page rather than same tab state.

## G2-3-029-038  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:45-55`
- vNext now: `src/components/projects/admin-project-section-page.tsx:34-47`
- Fix: Legacy has distinct loading, failed with Retry, no scope and not-found states; vNext SSR requires error/loading boundary parity.

## G2-3-029-045  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:23-33`
- vNext now: `src/components/projects/admin-project-section-page.tsx:38-47`
- Fix: Legacy Ant Alert warning showIcon and Skeleton active labels; vNext generic error and loading page may lack equivalent aria-live and focus.

## G2-3-029-058  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:45-55`
- vNext now: `src/components/projects/admin-project-section-page.tsx:34-47`
- Fix: Legacy exact no-college, error-retry and workspace-not-found UI states require explicit route-level clone handling.

## G2-14-028-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy /superadmin/projects/workspaces/{id}/summary under SuperAdminWorkspaceShell. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:83-89,405-411`
- vNext now: vNext /admin/projects/{UUID}/summary after guarded redirect, canonical ProjectWorkspace. `src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-29`, `src/components/projects/admin-project-section-page.tsx:19-74`
- Fix: Map deep links and old numeric IDs.

## G2-14-028-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy missing college preserves tab shell and selector guidance. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:359-377`
- vNext now: vNext requires scoped manage access; missing college routed to error boundary. `src/components/projects/admin-project-section-page.tsx:34-47`
- Fix: Keep selected-college recoverability in page.

## G2-14-028-018  [P2] GAP  facet F05  effort M
- Legacy: Legacy eight-row loading skeleton and scoped error retry. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:492-493`
- vNext now: vNext server loader with route boundary, no same skeleton in component. `src/components/projects/admin-project-section-page.tsx:34-47`
- Fix: Add equivalent loading and retry UI.

## G2-14-028-040  [P2] GAP  facet F11  effort M
- Legacy: Legacy no college warning, preserving shell and tabs. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:359-378`
- vNext now: vNext access failure can present generic error page. `src/components/projects/admin-project-section-page.tsx:34-47`
- Fix: Provide scope selection with safe retry.

## G2-14-028-044  [P2] GAP  facet F13  effort M
- Legacy: Legacy failed load Retry, eight-row Skeleton, missing workspace warning. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:487-493,679-681`
- vNext now: vNext project access read throws to route boundary, not inline retry. `src/components/projects/admin-project-section-page.tsx:34-47`
- Fix: Create specific unavailable/not-found states.

## G2-14-028-045  [P2] GAP  facet F13  effort M
- Legacy: Legacy openTemplate=1 query autoopens template dialog if no template. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:252-265`
- vNext now: vNext only from/reason params, not openTemplate. `src/components/projects/admin-project-section-page.tsx:49-56`
- Fix: Preserve list-to-template-action deep link.

## G2-5-028-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy View opens 520px Drawer with details. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:676-713`
- vNext now: vNext Open navigates to full ProjectWorkspace detail page. `src/components/projects/admin-project-section-page.tsx:19-75`, `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Add legacy quick-view drawer, keep deep-link as extra.

## G2-5-028-011  [P2] GAP  facet F03  effort M
- Legacy: Legacy member chips display role, userType, status with member name. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:695-709`
- vNext now: vNext detail is full workspace, membership chips rendered elsewhere. `src/components/projects/admin-project-section-page.tsx:58-75`
- Fix: Provide exact member details in quick view with role/status.

## G2-5-028-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy drawer fields Slug, Course, Mentor, Phase, Status, Progress, Due, Blocker, Next Action, Members. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:685-710`
- vNext now: vNext detail route delegates to ProjectWorkspace instead of exact summary drawer. `src/components/projects/admin-project-section-page.tsx:43-74`
- Fix: Render same at-a-glance read fields and fallback placeholders.

## G2-5-028-036  [P2] GAP  facet F09  effort M
- Legacy: Legacy 520px read-only project detail Drawer. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:676-713`
- vNext now: vNext full detail page; no list-view drawer. `src/components/projects/admin-project-section-page.tsx:58-75`
- Fix: Reintroduce quick view with 520px drawer and safe close.

## G2-7-007-001  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:73-89: workspace Audit lives at `/college-admin/projects/workspaces/:slug/audit` with AdminWorkspaceShell.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx:1-25 and components/projects/admin-project-section-page.tsx:19-32: UUID route `/college/projects/:id/audit` dynamic section.
- Fix: Provide compatibility redirect for old workspace slug URLs to new project UUID route.

## G2-7-011-001  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:37-46,119-126: legacy route `/college-admin/projects/workspaces/:slug/overview`, Projects menu active.
- vNext now: V/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx:1-16 redirects to `/college/projects/:id/overview`, retaining section; admin-project-section-page.tsx:49-73 builds tab links.
- Fix: Keep slug compatibility and query/from context on redirect; assert tab active and legacy breadcrumbs.

## G2-7-012-007  [P2] GAP  facet F02  effort M
- Legacy: readiness.js:83-95 Alert then six-row Skeleton/content
- vNext now: admin-project-section-page.tsx:38-47 awaits aggregate read
- Fix: Render six-row skeleton and retryable alert

## G2-12-028-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:19-22,61-66 SuperAdminLayout /superadmin/projects/workspaces/{workspaceId}/team with selected college scope
- vNext now: src/components/projects/admin-project-section-page.tsx:19-75 ADMIN team via /admin/projects/{projectId}/team equivalent; src/components/projects/project-workspace.tsx:75-105 ten tabs
- Fix: Keep legacy team deep link redirect and tab order/labels in shell

## G2-12-028-037  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:467-487 error alert Retry, Skeleton six rows, Workspace not found
- vNext now: src/components/projects/admin-project-section-page.tsx:38-47 server action throws/404, no local Retry in team component
- Fix: Add local retry/could-not-load/not-found distinctions while preserving tab shell

## G2-19-028-001  [P2] GAP  facet F01  effort M
- Legacy: meetings.js:25-28 Super Admin workspace route
- vNext now: admin-project-section-page.tsx:19-35 selected project route
- Fix: Redirect old deep link

## G2-19-028-011  [P2] GAP  facet F11  effort M
- Legacy: meetings.js:87-104 no-college alert inside tab shell
- vNext now: admin-project-section-page.tsx:38-47 access throws before shell
- Fix: Preserve scoped empty state

## G2-19-028-013  [P2] GAP  facet F13  effort M
- Legacy: meetings.js:115-132 Retry error, Skeleton6, not-found
- vNext now: admin-project-section-page.tsx:38-47 server fetch, no local retry
- Fix: Restore recovery states

## G2-16-028-045  [P3] GAP  facet F19  effort M
- Legacy: superAdminWorkspaceSection.js:16-52 requestSeq ignores superseded responses on refresh and college change.
- vNext now: admin-project-section-page.tsx:18-44 server page reload; client mutations router.refresh.
- Fix: Audit race between changing acting college and mutation refresh; do not render stale project.

## G2-3-029-019  [P3] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:10-16`
- vNext now: `src/components/projects/admin-project-section-page.tsx:19-35`
- Fix: Legacy no user-visible sort/filter on Delivery page; vNext iterates all submissions in backend order. Confirm latest first/last chronology and current version precedence.
