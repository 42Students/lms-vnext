# Work packet (wave 2): edit src/app/api/projects/[projectId]/activity/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u018-project-activity-event.md

## G2-5-018-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy activity comes from `/{projectId}/activity` and `/activity/feed` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:426-463`
- vNext now: New API route /api/projects/[projectId]/activity serves cursor feeds `src/app/api/projects/[projectId]/activity/route.ts:1-45`
- Fix: Map old activity links or migrate consumers to new route and cursor.
