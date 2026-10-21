# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/l12-u026-project-workspace-controller.md

3 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l12-u026-project-workspace-controller.md

## G2-12-026-007  [P1] GAP  facet F05  effort M
- Legacy: Activity /activity/feed accepts page,size,eventType,sourceTab,fromDate,toDate (ProjectWorkspaceController.java:438-463).
- vNext now: /activity GET parses only beforeTime/beforeId cursor (projects/[projectId]/activity/route.ts:8-25).
- Fix: Add eventType/sourceTab/date range filters or matched client adapter.

## G2-12-026-039  [P1] GAP  facet F23  effort M
- Legacy: Activity feed eventType/sourceTab/date filters (ProjectWorkspaceController.java:438-469).
- vNext now: Cursor activity API omits those filters (projects/[projectId]/activity/route.ts:8-26).
- Fix: Reinstate filters or provide faithful UI-side adapter.

## G2-12-026-012  [P2] GAP  facet F07  effort M
- Legacy: Save error returns NOT_FOUND only when message includes 'not found', else BAD_REQUEST (ProjectWorkspaceController.java:721-732).
- vNext now: apiErrorResponse catch maps error codes (projects/[projectId]/route.ts:30-42).
- Fix: Match 400 vs 404 for bad field vs missing resource and meaningful text.
