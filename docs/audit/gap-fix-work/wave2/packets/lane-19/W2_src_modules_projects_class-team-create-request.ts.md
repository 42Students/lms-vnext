# Work packet (wave 2): edit src/modules/projects/class-team-create-request.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md

## G2-2-020-022  [P2] GAP  facet F06  effort M
- Legacy: AdminProjectBulkCreateDTO.java:9-21 optional status, phase, mentor on cohort
- vNext now: src/modules/projects/class-team-create-request.ts:1 preview version and roster revision; no phase/status
- Fix: Preserve initial status, phase and mentor selection with preview token.
