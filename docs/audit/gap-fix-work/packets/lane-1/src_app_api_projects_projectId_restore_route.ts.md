# Work packet: edit src/app/api/projects/[projectId]/restore/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md

## G2-2-020-030  [P2] GAP  facet F08  effort M
- Legacy: AdminProjectController.java:355 Deleted projects retrieved,622 Project restored
- vNext now: src/app/api/projects/[projectId]/restore/route.ts:13-15 bare project
- Fix: Keep user-facing restoration warning and success.
