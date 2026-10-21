# Work packet: edit src/app/api/projects/[projectId]/brief/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u028-superadmin-workspace-overview.md, docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md

## G2-18-028-026  [P1] GAP  facet F10  effort L
- Legacy: Legacy PUT /api/v1/admin/projects/{id}?collegeId sends detailsToken and merged overview including unknown facts; overview.js:78-97;AdminService.js:361-362
- vNext now: New PATCH /api/projects/{id}/brief sends strict brief plus expectedUpdatedAt; workspace-brief-editor.tsx:20-30;src/app/api/projects/[projectId]/brief/route.ts:7-13
- Fix: Guard unknown-key preservation and template inheritance across update

## G2-7-011-041  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:91-111 and AdminService.js:361-362: PUT `/api/v1/admin/projects/{slug}?collegeId=N`, payload `{detailsToken, overview:{...unknown,goal,deliverables,definitionOfDone,personas}}`.
- vNext now: V/components/projects/workspace-brief-editor.tsx:28-30 and app/api/projects/[projectId]/brief/route.ts:7-13: PATCH `/api/projects/{UUID}/brief` `{brief:{goal,description,deliverables,completionConditions,personas},expectedUpdatedAt}`.
- Fix: Map payload keys and concurrency semantics; keep selected-college boundary on route.
