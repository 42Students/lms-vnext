# Work packet: edit src/app/api/placements/tpo/rounds/[roundId]/bulk-confirmed-results/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md

## G2-16-031-030  [P1] GAP  facet F10  effort L
- Legacy: TpoResultsController.java:46-71 POST stage, GET pending, POST apply with notify flag
- vNext now: src/app/api/placements/tpo/rounds/[roundId]/bulk-confirmed-results/route.ts:11-24 POST confirmation
- Fix: Distinguish staged/pending/applied state; confirm notifications flag and per-row skipped persistence

## G2-16-031-024  [P2] GAP  facet F08  effort M
- Legacy: TpoResultsController.java:62-71 applies results with HTTP202 body {applied, skipped} and audit
- vNext now: src/app/api/placements/tpo/rounds/[roundId]/bulk-confirmed-results/route.ts:11-24 returns service body
- Fix: Show applied and skipped counts separately with per-app reasons; preserve retriable pending rows
