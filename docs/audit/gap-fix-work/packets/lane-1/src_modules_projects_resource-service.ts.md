# Work packet: edit src/modules/projects/resource-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md, docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-16-028-027  [P1] GAP  facet F10  effort L
- Legacy: AdminService.js:361-363 and resources.js:49-52 issue PUT `/api/v1/admin/projects/{id}?collegeId={id}` with `{resources,resourcesToken}`.
- vNext now: route.ts:24-64 POST `/api/projects/{projectId}/resources` per single resource; resource-service.ts:87-180 transactional insert.
- Fix: Implement one atomic section replace/reorder endpoint with resources token or adjust UX to explicit per-row saves.

## G2-16-028-029  [P1] GAP  facet F10  effort L
- Legacy: ProjectWorkspaceUpdateDTO.java:22-36 resourcesToken rejects stale full-array writes with 409.
- vNext now: resource-service.ts:220-260 uses `expectedUpdatedAt` for existing single row, not a collection snapshot.
- Fix: Add collection version/token validation to prevent concurrent section saves/reorder overwrites.

## G2-16-028-033  [P1] GAP  facet F12  effort L
- Legacy: ProjectWorkspaceUpdateDTO.java:18-36 omitted sections leave other sections unchanged; resourcesToken only this list.
- vNext now: resource-service.ts:87-180 per-row create, update and reorder endpoints; no multi-item complete replacement.
- Fix: Use section-granular atomic transaction; ensure other sections remain untouched.

## G2-16-028-046  [P1] GAP  facet F20  effort M
- Legacy: resources.js:40-58 guards untouched saves, echoes resourcesToken and reseeds after reload, preventing blind array clobber.
- vNext now: project-resource-controls.tsx:200-253 guards dirty modal; resource-service.ts:149-169 inserts sequential next sequence.
- Fix: Use optimistic section version and idempotent Save for multi-tab replay.

## G2-4-029-036  [P1] GAP  facet F11  effort S
- Legacy: Workspace detail independent of college module availability (`docs/legacy-source/frontend/src/components/admin/SuperAdminWorkspaceShell.jsx:9-10`)
- vNext now: Resource read requires projects module enabled (`src/modules/projects/resource-service.ts:67-69`)
- Fix: Ensure Super Admin global audit read not blocked by college module flag if old access allowed.

## G2-7-013-040  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:52-60: PUT /api/v1/admin/projects/:slug?collegeId, only resources + resourcesToken
- vNext now: V/components/projects/project-resource-controls.tsx:227-249,389-403; resource-service.ts:92-199,201-346: POST/PATCH per resource
- Fix: Define batched/atomic equivalent or partial-save reconciliation contract

## G2-15-017-025  [P1] MISSING  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:845-854 require admin scope & projects feature gate
- vNext now: src/modules/projects/resource-service.ts:67-74 module/project guard only for current resources
- Fix: Apply same college and feature permission to history endpoint

## G2-15-017-026  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V80__project_resource_audit.sql:1-20 durable project_resource_audit SQL table
- vNext now: src/modules/projects/resource-service.ts:175-178,327-329,424-426 emits generic activity event only
- Fix: Append detailed history in same transaction as create/edit/archive

## G2-15-017-028  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectResourceAudit.java:39-41 resource order captured
- vNext now: src/modules/projects/resource-service.ts:464-487 reorder emits aggregate activity but no per-resource snapshot
- Fix: Audit each reordered resource with before/after position
