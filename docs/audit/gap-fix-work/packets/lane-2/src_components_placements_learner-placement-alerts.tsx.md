# Work packet: edit src/components/placements/learner-placement-alerts.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md

## G2-12-005-014  [P1] GAP  facet F04  effort S
- Legacy: Debarment untilDate and untilDrives are visible, plus reason `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:162-173`
- vNext now: Generic personal notifications title/body/time, no explicit debarment interval model `src/components/placements/learner-placement-alerts.tsx:9-50`
- Fix: Display structured restriction reason and expiry in page
