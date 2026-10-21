# Work packet (wave 2): edit src/app/api/projects/[projectId]/releases/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l12-u026-project-workspace-controller.md

## G2-12-026-004  [P2] GAP  facet F03  effort M
- Legacy: No UI chrome in controller, success strings act as toast 'Sprint started', 'Release shipped' (ProjectWorkspaceController.java:154-201,264-290).
- vNext now: POST routes return JSON entity, no message string (projects/[projectId]/sprints/route.ts:11-25; releases/route.ts:9-20).
- Fix: Map success copy in callers, maintain legacy toast wording.

## G2-12-026-032  [P2] GAP  facet F18  effort M
- Legacy: Exact messages 'Projects retrieved', 'Project updated', 'Release shipped', 'Meeting requested' (ProjectWorkspaceController.java:81-128,264-275,509-520).
- vNext now: JSON route outputs objects, no success messages (projects/[projectId]/route.ts:29-40; releases/route.ts:13-14).
- Fix: Restore visible success copy through shared response adapter.
