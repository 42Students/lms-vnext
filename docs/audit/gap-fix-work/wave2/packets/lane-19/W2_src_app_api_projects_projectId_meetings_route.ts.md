# Work packet (wave 2): edit src/app/api/projects/[projectId]/meetings/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/project-meeting.md

## G2-20-017-001  [P2] GAP  facet F01  effort M
- Legacy: Meetings embedded in workspace PUT /{projectId}/meetings and GET meeting list `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:471-483`
- vNext now: GET/POST /api/projects/[projectId]/meetings, scoped service commands `src/app/api/projects/[projectId]/meetings/route.ts:18-60`
- Fix: Preserve route actions and adapt old single bulk PUT to new per-meeting operations
