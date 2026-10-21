# Work packet (wave 2): edit src/modules/courses/faculty-submission-review-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/assignment-controller.md

## G2-2-026-057  [P2] GAP  facet F11  effort M
- Legacy: AssignmentController.java:236-266 omits forbidden stats IDs (not 403 per entry).
- vNext now: faculty-submission-review-service.ts:13-35 rejects foreign assignment/delivery as one unit.
- Fix: If reintroducing bulk stats, preserve per-ID filtering rather than all-or-nothing roster leak.

## G2-2-026-085  [P2] GAP  facet F19  effort M
- Legacy: AssignmentController.java:236-267 dedupes and caps bulk stat IDs at 100.
- vNext now: faculty-submission-review-service.ts:13-35 one-assignment query; no equivalent batch optimization.
- Fix: Batch roster stats with deduped <=100 IDs; enforce per-item authorization.
