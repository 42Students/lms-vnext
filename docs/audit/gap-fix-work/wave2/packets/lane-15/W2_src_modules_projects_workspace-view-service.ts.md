# Work packet (wave 2): edit src/modules/projects/workspace-view-service.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-project-detail.md, docs/audit/gap2/lane-3/superadmin-workspace-delivery.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md, docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md, docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md

## G2-17-004-036  [P2] GAP  facet F19  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-14 client detail stays mounted across tab changes, potentially reuses same fetched workspace.
- vNext now: src/modules/projects/workspace-view-service.ts:33-67 invokes eight server reads per page; src/app/(authenticated)/learn/projects/[projectId]/page.tsx:105-114 adds tab-specific reads.
- Fix: Instrument tab-switch request count and avoid redundant full workspace aggregation when changing filter/query.

## G2-3-029-018  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:119-135`
- vNext now: `src/modules/projects/workspace-view-service.ts:37-66`
- Fix: Legacy review fields are on resolvedDelivery; vNext getProjectWorkspaceView assembles separate finalDelivery.reviews and evaluations. Join latest proper review metadata.

## G2-3-029-030  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/superAdminWorkspaceSection.js:28-55`
- vNext now: `src/modules/projects/workspace-view-service.ts:33-67`
- Fix: Legacy fetches one college-scoped workspace through admin API on client; vNext parallel server fetch of workspace/members/readiness/reviews/activity, with different failure cascade.

## G2-3-029-036  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/superAdminWorkspaceSection.js:17-27`
- vNext now: `src/modules/projects/workspace-view-service.ts:33-67`
- Fix: Legacy data fetch starts loading true to avoid first render not-found; vNext server-rendered page needs route loading.tsx parity for equivalent skeleton.

## G2-3-029-050  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/superAdminWorkspaceSection.js:24-49`
- vNext now: `src/modules/projects/workspace-view-service.ts:37-67`
- Fix: Legacy retrieves one workspace JSON in one call, vNext launches 8 parallel subqueries, increasing query/connection pressure.

## G2-3-029-055  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js:15-16`
- vNext now: `src/modules/projects/workspace-view-service.ts:33-66`
- Fix: Legacy AdminService.getProjectWorkspaceById resolves college-scope payload; vNext typed workspace-view DB aggregator has different failure and loading telemetry.

## G2-4-029-056  [P2] GAP  facet F19  effort M
- Legacy: Backend bounded recent history by pageable and sorted newest first (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectResourceAuditRepository.java:15-22`)
- vNext now: Generic workspace activity, not specific resource history (`src/modules/projects/workspace-view-service.ts:29-67`)
- Fix: Query resource-only rows newest first with server page/count.

## G2-4-029-061  [P2] GAP  facet F21  effort M
- Legacy: UI imports resource audit component and old services (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:1-11`)
- vNext now: Server workspace aggregate loads activity service (`src/modules/projects/workspace-view-service.ts:29-67`)
- Fix: Use discrete admin resource-audit service, avoid whole workspace dependencies.

## G2-7-011-040  [P2] GAP  facet F10  effort L
- Legacy: LFE/components/admin/projects/adminWorkspaceSection.js:25-57 and AdminService.js:388-389: GET `/api/v1/admin/projects/{slug}?collegeId=N` once on mount/reload.
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47; modules/projects/workspace-view-service.ts:37-67: aggregate 8 service reads.
- Fix: Use section-specific projection/cache while preserving tenant enforcement and error states.

## G2-7-012-030  [P2] GAP  facet F10  effort L
- Legacy: readiness.js:20-27,62-65 one GET embeds readiness DTO
- vNext now: workspace-view-service.ts:37-67 eight service calls, readiness-service.ts:34-115 multiple SQL reads
- Fix: Optimize section projection and preserve error isolation

## G2-7-012-053  [P2] GAP  facet F19  effort L
- Legacy: readiness.js:20-38 one GET and O(n) proof filter
- vNext now: workspace-view-service.ts:37-67 eight related reads plus readiness
- Fix: Readiness-only projections for large workspaces

## G2-7-013-039  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:17-24: GET workspace via adminWorkspaceSection and prefill resources JSON array
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47; modules/projects/workspace-view-service.ts:37-67: aggregate load; resources normalized
- Fix: Project normalized resource DTO onto legacy field identities

## G2-7-015-045  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:245-281 one scoped GET admin workspace
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47 and workspace-view-service.ts:37-67 aggregate read
- Fix: Avoid unrelated fetch blocking Summary load

## G2-7-027-088  [P2] GAP  facet F21  effort L
- Legacy: PDC:38-95 projectService imports task/member/meeting/resource/upload API integrations
- vNext now: workspace-view-service.ts:9-31 multiple module services and DB reads
- Fix: Map every action request and notification into new typed API route/service
