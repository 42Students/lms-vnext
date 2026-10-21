# Work packet (wave 2): edit src/app/api/projects/[projectId]/members/[memberId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l12-u026-project-workspace-controller.md

## G2-12-026-024  [P2] GAP  facet F12  effort M
- Legacy: Member remove is POST /members/{memberId}/remove, not DELETE (ProjectWorkspaceController.java:695-708).
- vNext now: Member mutation uses /members/[memberId]/route.ts (src/app/api/projects/[projectId]/members/*).
- Fix: Document changed HTTP method and safe client migration.
