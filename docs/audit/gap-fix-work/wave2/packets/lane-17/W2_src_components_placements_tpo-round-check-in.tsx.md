# Work packet (wave 2): edit src/components/placements/tpo-round-check-in.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-013  [P2] GAP  facet F03  effort S
- Legacy: `Present` button has check icon, becomes filled+disabled when present. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:329`
- vNext now: `Mark checked-in` secondary action and confirmation. `src/components/placements/tpo-round-check-in.tsx:44`
- Fix: Preserve literal label and selected visual state.

## G2-11-008-014  [P2] GAP  facet F03  effort S
- Legacy: `Absent` red button has X icon. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:330`
- vNext now: `Mark no-show` outlined button. `src/components/placements/tpo-round-check-in.tsx:50`
- Fix: Restore danger icon/color and `Absent` copy.

## G2-11-008-076  [P2] MISSING  facet F18  effort S
- Legacy: Exact room placeholder includes `(optional)`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:297`
- vNext now: Room input missing. `src/components/placements/tpo-round-check-in.tsx:43`
- Fix: Port exact placeholder.

## G2-11-008-080  [P2] GAP  facet F20  effort M
- Legacy: Global mutationRef prevents cross-student overlap. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:91`
- vNext now: Individual TPO check-in components each hold own busy flag. `src/components/placements/tpo-round-check-in.tsx:21`
- Fix: Use transaction concurrency guarantees and decide global guard parity.
