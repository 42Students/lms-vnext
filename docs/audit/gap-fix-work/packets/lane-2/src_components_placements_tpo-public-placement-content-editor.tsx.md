# Work packet: edit src/components/placements/tpo-public-placement-content-editor.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md

## G2-17-022-018  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:19-35 — Couldn't load placements page with Retry, Couldn't save.
- vNext now: src/components/placements/tpo-public-placement-content-editor.tsx:52-53 — Save error with retained text, no legacy exact fallback.
- Fix: Match exact wording and load retry.
