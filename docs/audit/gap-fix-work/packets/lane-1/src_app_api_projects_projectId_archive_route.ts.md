# Work packet: edit src/app/api/projects/[projectId]/archive/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md

## G2-2-020-004  [P1] MISSING  facet F01  effort M
- Legacy: AdminProjectController.java:581-631 distinct delete and restore
- vNext now: src/app/api/projects/[projectId]/archive/route.ts:16-54 and restore/route.ts:8-16, no delete route in inspected API tree
- Fix: Restore deleted workspace state and discoverable recovery, separately from archive.
