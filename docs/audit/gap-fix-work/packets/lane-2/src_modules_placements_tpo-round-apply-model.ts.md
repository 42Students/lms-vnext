# Work packet: edit src/modules/placements/tpo-round-apply-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-022  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:59-64 — invalid move: Cannot move from X to Y
- vNext now: src/modules/placements/tpo-round-apply-model.ts:30-32 — all bulk-apply failures sanitized as Result was not applied. Refresh this round and try again.
- Fix: Show safe actionable stage-specific skip causes without exposing SQL/private info
