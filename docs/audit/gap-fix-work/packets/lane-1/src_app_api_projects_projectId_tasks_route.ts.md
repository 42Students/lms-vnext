# Work packet: edit src/app/api/projects/[projectId]/tasks/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l12-u026-project-workspace-controller.md

## G2-12-026-014  [P2] GAP  facet F08  effort M
- Legacy: Project update success 'Project updated', task change 'Project tasks updated' (ProjectWorkspaceController.java:120-149,557-602).
- vNext now: No legacy envelope/strings, object payloads (projects/[projectId]/route.ts:35-42; tasks/route.ts:13-35).
- Fix: Have UI show exact success strings.
