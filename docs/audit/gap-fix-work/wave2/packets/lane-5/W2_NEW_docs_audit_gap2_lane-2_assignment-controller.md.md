# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/assignment-controller.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md

## G2-2-026-049  [P2] GAP  facet F10  effort M
- Legacy: AssignmentController.java:295-312 POST `/publishGrade` with query studentAssignmentId.
- vNext now: publish/route.ts:17-40 POST JSON `{expectedVersion}` keyed by UUID.
- Fix: Implement caller migration and guarantee publication version from current saved grade.
