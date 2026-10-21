# Work packet (wave 3): edit src/components/placements/tpo-round-drive-day-read-only.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-032  [P1] MISSING  facet F06  effort L
- Legacy: Paste attendance modal has five-row auto-focused textarea, dynamic count and dynamic Mark button. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:359`
- vNext now: Only bulk *result* disclosure exists. `src/components/placements/tpo-round-drive-day-read-only.tsx:290`
- Fix: Create attendance paste modal distinct from result import.

## G2-11-008-081  [P1] MISSING  facet F20  effort L
- Legacy: Attendance bulk is sequential and retains failed/unmatched tokens on partial failure. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:155`
- vNext now: No bulk attendance retry. `src/components/placements/tpo-round-drive-day-read-only.tsx:290`
- Fix: Add per-item result and unresolved-only retry.
