# Work packet (wave 2): edit src/app/api/projects/cohort-preflight/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md

## G2-2-020-002  [P2] GAP  facet F01  effort M
- Legacy: AdminProjectController.java:198-243 POST bulk/preflight and bulk
- vNext now: src/app/api/projects/cohort-preflight/route.ts:6-14 GET; class-team-workspaces/route.ts:8-19 POST
- Fix: Preserve same preflight and commit result contract, including no-eligible and partial failure.
