# Work packet (wave 2): edit src/app/api/projects/[projectId]/archive/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md

## G2-2-020-033  [P2] GAP  facet F09  effort M
- Legacy: AdminProjectController.java:555-605 separate archive and delete actions
- vNext now: src/app/api/projects/[projectId]/archive/route.ts:16-54 archive with token
- Fix: Ensure separate destructive confirmation flows.
