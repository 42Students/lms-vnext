# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

## G2-19-024-049  [P1] MISSING  facet F23  effort L
- Legacy: Legacy bulk edit/delete single logical announcement and unique read fraction; PlacementAnnouncementService.java:338-404
- vNext now: Per-college vNext rows, generic single-item mutations; broadcast-service.ts:69-117
- Fix: Group broadcast CRUD and counted read aggregation before parity closure.
