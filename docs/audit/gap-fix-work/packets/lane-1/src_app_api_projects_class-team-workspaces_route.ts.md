# Work packet: edit src/app/api/projects/class-team-workspaces/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md

## G2-2-020-003  [P1] GAP  facet F01  effort M
- Legacy: AdminProjectController.java:79-139 create teams and team reconcile
- vNext now: src/app/api/projects/class-team-workspaces/route.ts:8-19 create only
- Fix: Expose per-team group reconciliation and status/count results.

## G2-2-020-027  [P2] GAP  facet F07  effort M
- Legacy: AdminProjectController.java:94-105 503 Project teams are not available
- vNext now: src/app/api/projects/class-team-workspaces/route.ts:16-18 generic error map
- Fix: Expose operator-safe unavailable/error state and no-write guarantee.

## G2-2-020-029  [P2] MISSING  facet F08  effort M
- Legacy: AdminProjectController.java:129 Team already in step/Team repaired
- vNext now: src/app/api/projects/class-team-workspaces/route.ts:8-19 no reconcile action
- Fix: Restore repair/no-op outcome and changed count.
