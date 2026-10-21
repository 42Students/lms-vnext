# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/l12-u026-project-workspace-controller.md

9 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l12-u026-project-workspace-controller.md

## G2-12-026-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy /api/v1/projects/* returns Response<T> with OK/message/data (ProjectWorkspaceController.java:55-58,81-118).
- vNext now: Next /api/projects/[projectId] returns {workspace}, separate resource endpoints (projects/[projectId]/route.ts:16-33).
- Fix: Provide API mapping and preserve client-visible success/error copy.

## G2-12-026-003  [P2] GAP  facet F02  effort M
- Legacy: Monolithic Controller groups workspace sections under one projectId (ProjectWorkspaceController.java:120-149,294-309).
- vNext now: Per-resource routes sprint/release/task/resource/meeting/brief (projects/[projectId]/sprints/route.ts:1-28 and related).
- Fix: Map each legacy nested tab to corresponding vNext API/state.

## G2-12-026-006  [P2] GAP  facet F04  effort M
- Legacy: Task list supports lane/priority/assigneeId/sprintScope filter (ProjectWorkspaceController.java:524-540).
- vNext now: Task creation route POST only; separate task reads in other route/services (projects/[projectId]/tasks/route.ts:13-35).
- Fix: Restore/filter task list via documented endpoint with all 4 filters.

## G2-12-026-008  [P2] GAP  facet F05  effort M
- Legacy: fromDate inclusive start day, toDate 23:59:59 (ProjectWorkspaceController.java:445-463).
- vNext now: Activity accepts cursor timestamps, not date range (projects/[projectId]/activity/route.ts:14-18).
- Fix: Maintain user IST day bounds when reinstating filters.

## G2-12-026-011  [P2] GAP  facet F06  effort M
- Legacy: Project update/section payload ProjectWorkspaceUpdateDTO, no @Valid on update body (ProjectWorkspaceController.java:120-149,710-719).
- vNext now: PATCH summary route has strict context, projectMutation (projects/[projectId]/route.ts:35-42).
- Fix: Validate per-section DTO and preserve field merge vs replacement semantics.

## G2-12-026-026  [P2] GAP  facet F13  effort M
- Legacy: Storage unavailable 503, read failure 500 'Failed to open resource file' (ProjectWorkspaceController.java:310-340).
- vNext now: Signed download grant service/API returns own errors (resource-files/[fileId]/download-grant/route.ts:17-30).
- Fix: Map unavailable storage and invalid resource error copy and retry.

## G2-12-026-027  [P2] GAP  facet F14  effort M
- Legacy: GET resource/{resourceKey}/download streams inline S3 object, private no-store (ProjectWorkspaceController.java:310-332).
- vNext now: POST resource-files/{fileId}/download-grant returns signed grant (download-grant/route.ts:17-30).
- Fix: Confirm inline/attachment behavior, filename, mime and safe signed URL TTL.

## G2-12-026-036  [P2] GAP  facet F21  effort M
- Legacy: ProjectWorkspaceService handles member search, activity, delivery, readiness, meetings (ProjectWorkspaceController.java:343-523,643-708).
- vNext now: Multiple projects services / routes, no monolithic service (src/app/api/projects/[projectId]/*).
- Fix: Produce service/route index verifying all 42 actions and integration side effects.

## G2-12-026-038  [P2] GAP  facet F23  effort M
- Legacy: /submission aliases /delivery for GET and PUT, history and review endpoints (ProjectWorkspaceController.java:342-400).
- vNext now: Submission lifecycle uses /submissions/{id} and mentor decisions, no /submission alias (src/app/api/projects/[projectId]/submissions/*).
- Fix: Map old alias calls and preserve final delivery history/review semantics.
