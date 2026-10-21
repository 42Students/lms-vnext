# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md

## G2-12-005-053  [P2] GAP  facet F13  effort S
- Legacy: Initial 6-row active Skeleton; failed single `We could not load this page` Alert Retry `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:68-69`
- vNext now: Route error state full-page Retry, while optional request/alert errors handled in sections `src/app/(authenticated)/learn/my-placements/error.tsx:14-21`
- Fix: Match initial skeleton and localized retry
