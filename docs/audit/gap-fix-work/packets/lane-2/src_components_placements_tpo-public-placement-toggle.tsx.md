# Work packet: edit src/components/placements/tpo-public-placement-toggle.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md

## G2-17-022-021  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:30-32 — Save success toast `Saved`, toggle `Your placements page is live/off`.
- vNext now: src/components/placements/tpo-public-placement-toggle.tsx:25-35 — Inline status message same toggle wording.
- Fix: Align toast vs inline success placement.
