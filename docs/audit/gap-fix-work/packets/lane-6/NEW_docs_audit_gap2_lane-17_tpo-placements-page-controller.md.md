# Work packet: NEW / MISSING items from docs/audit/gap2/lane-17/tpo-placements-page-controller.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md

## G2-17-022-020  [P1] GAP  facet F07  effort M
- Legacy: src/app/(authenticated)/tpo/settings/public-page/page.tsx:50-55 — New minimum five cohort warning blocks enable.
- vNext now: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:7-10 — Legacy suppresses individual metrics rather than page enable.
- Fix: Document intentional stronger privacy gating and make reason clear.

## G2-17-022-022  [P3] GAP  facet F08  effort M
- Legacy: src/app/(authenticated)/tpo/settings/public-page/page.tsx:38-38 — Redirect query shows InlineNotice success.
- vNext now: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:30-32 — Legacy AntD toast immediate.
- Fix: Match duration and location if cloned.
