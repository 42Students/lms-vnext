# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u007-college-admin-workspace-audit.md

17 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u007-college-admin-workspace-audit.md

## G2-7-007-002  [P1] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:78-86: `View audit trail` opens `/college-admin/projects/audit?entityId=<slug>&range=all`.
- vNext now: V/components/projects/project-workspace.tsx:1669-1670: admin view hardcodes `/admin/projects/audit?projectId=<uuid>`, wrong superadmin namespace and filter keys.
- Fix: Generate `/college/projects/audit?subjectId=<uuid>&range=all` (or supported params) for College Admin; test route and role.

## G2-7-007-005  [P1] GAP  facet F02  effort L
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:87-112: one Card with intro, four metrics, filter row then table.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:69-145: filter bar and event feed only, no enclosing Resource activity card/metric strip.
- Fix: Recreate Resource activity Card with counters and 4-column data table.

## G2-7-007-014  [P1] GAP  facet F05  effort L
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:63-85: four columns Resource, Action, Actor, When.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:119-138: article feed with summary, actor/time and two neutral badges.
- Fix: Restore exact four-column semantic audit table.

## G2-7-007-015  [P1] GAP  facet F05  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:149-159: 10 rows per page, fixed, paged total `a–b of N matching changes`.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:19-21,139-142: initial 100 global events with cursor Load more; no 10-row pager or matching range text.
- Fix: Page resource history at 10, and show exact result range and total.

## G2-7-007-021  [P1] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:90-98: failure of workspace summary shows warning and retry, audit data remains available.
- vNext now: V/components/projects/admin-project-section-page.tsx:26-40: awaits full `getProjectWorkspaceView` and no per-service catch; summary failure can prevent rendering audit section.
- Fix: Fetch workspace summary and resource audit independently; show partial warning with usable audit history.

## G2-7-007-022  [P1] GAP  facet F07  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:135-145: audit fetch failure shows `Resource audit could not be loaded`, server reason and Retry.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:23-47,143: only load-more failure text; initial event read is part of full server render with no local retry.
- Fix: Add isolated audit initial-fetch error and exact retry action.

## G2-7-007-026  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:21-51: separate GET workspace summary and GET project resource audit (per college/slug), independent error/retry.
- vNext now: V/modules/projects/workspace-view-service.ts:37-66: Promise.all workspace, members, readiness, meetings, delivery, submissions, evaluation, activity, not independent resource audit.
- Fix: Split dedicated resource-audit read from workspace summary; avoid failing audit on unrelated services.

## G2-7-007-027  [P1] GAP  facet F10  effort L
- Legacy: LBE/controller/AdminProjectController.java:839-866: GET `/api/v1/admin/projects/{slug}/resource-audit?collegeId` returns ProjectResourceAudit records.
- vNext now: V/modules/projects/activity-service.ts:13-113: reads generic `activity_events` of module PROJECTS; `/api/projects/:id/activity` cursor used for more at filtered-list.tsx:25-46.
- Fix: Define dedicated resource-audit projection/endpoint retaining original resource fields/actions; keep typed event taxonomy migration.

## G2-7-007-032  [P1] GAP  facet F12  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:31-61: history is ONLY project resource changes, four action kinds.
- vNext now: V/modules/projects/project-resource-audit-model.ts:12-15: `filter="ALL"` matches every event type; default resourceAction ALL at filtered-list.tsx:50, so non-resource task/sprint records appear.
- Fix: Default resource-audit view to resource events only; prevent generic activity leakage.

## G2-7-007-034  [P1] GAP  facet F12  effort L
- Legacy: LBE/model/ProjectResourceAudit.java:38-51: resource_order, before_json, after_json, changed_fields retained for granular evidence.
- vNext now: V/modules/projects/activity-service.ts:25-48,110-113: projects activity select returns eventType/summary/actor/time, no before/after/changed field projection.
- Fix: Expose before/after diff and changed fields through authorized resource audit projection.

## G2-7-007-038  [P1] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:90-105: separate summary warning and resource audit error states.
- vNext now: V/modules/projects/workspace-view-service.ts:37-66: one Promise.all of many services; each failure throws whole view.
- Fix: Separate partial errors from audit read and unrelated workspace services.

## G2-7-007-049  [P1] GAP  facet F19  effort L
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:31-61: filters over entire fetched raw resource audit array.
- vNext now: V/modules/projects/activity-service.ts:99-113: initial 100 generic activity events, then cursor-load on demand, so local filter misses older resources until more fetched.
- Fix: Push resource filter/search into paged DB query before limiting; include total.

## G2-7-007-051  [P1] GAP  facet F20  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:83-84: URL encode project slug and query `entityId`, `range=all`.
- vNext now: V/components/projects/project-workspace.tsx:1669-1670: URL encodes UUID but uses `projectId` and wrong `/admin` prefix.
- Fix: Use supported audit query parser keys and correct panel-specific root.

## G2-7-007-053  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/ProjectResourceAudit.java:11-52 and backend migration V80__project_resource_audit.sql:1-21: physical resource audit table with resourceKey/action/actor/order/diffs indexed by project/time.
- vNext now: V/db/schema/project-audit-staged.ts:1-16,42-63: PostgreSQL resource audit schema is explicitly STAGED SOURCE ONLY, not imported into live schema.
- Fix: Promote audited migration and writer/reader or provide equivalent immutable event metadata with legacy fields and indexes.

## G2-7-007-054  [P1] GAP  facet F22  effort L
- Legacy: LBE/controller/AdminProjectController.java:839-866: dedicated resource-audit API returns ProjectResourceAudit list.
- vNext now: V/modules/projects/activity-service.ts:13-113: generic module PROJECTS events, actor name and time only; type IDs UUID.
- Fix: Build typed audit adapter with actionType, resourceKey, actor role, changedFields, before/after, timestamp.

## G2-7-007-057  [P1] GAP  facet F23  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:90-105: partial failure of workspace summary never hides audit.
- vNext now: V/modules/projects/workspace-view-service.ts:37-66: aggregate failures prevent all details.
- Fix: Prioritize resilient isolated resource-history read with independent Retry.

## G2-7-007-024  [P3] GAP  facet F08  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:135-145: error Alert and Retry, not toast; report read-only.
- vNext now: V/components/projects/project-activity-filtered-list.tsx:143: inline load-more error, no success toast.
- Fix: Match error alert with Retry; keep nonmutation toast-free.
