# Work packet (wave 2): edit src/components/placements/tpo-public-placement-toggle.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md

## G2-17-022-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:45-51 — Toggle says Placements page is on/off, web address.
- vNext now: src/components/placements/tpo-public-placement-toggle.tsx:37-39 — Button Turn placements page on/off.
- Fix: Use switch and on/off status text, link position.

## G2-17-022-015  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:50-51 — AntD Switch immediate save.
- vNext now: src/components/placements/tpo-public-placement-toggle.tsx:16-39 — Button formData POST, loading/disabled.
- Fix: Recreate switch styling/semantics, prevent premature publish.

## G2-17-022-037  [P3] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:50-62 — Switch aria-label and textarea aria-label, checkbox group.
- vNext now: src/components/placements/tpo-public-placement-toggle.tsx:37-39 — Button instead of switch; labeled action.
- Fix: Match switch ARIA role and keyboard toggle.
