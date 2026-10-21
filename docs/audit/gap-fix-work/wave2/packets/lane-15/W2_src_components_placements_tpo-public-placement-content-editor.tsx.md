# Work packet (wave 2): edit src/components/placements/tpo-public-placement-content-editor.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md

## G2-17-022-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:54-62 — About label, 4000 char count, Save; seven checkbox options.
- vNext now: src/components/placements/tpo-public-placement-content-editor.tsx:58-72 — About textarea with counter, checkbox options + reordering.
- Fix: Match exact option labels/order and visible count treatment.

## G2-17-022-013  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:61-62 — Checkbox immediate autosave, preserving order of selection.
- vNext now: src/components/placements/tpo-public-placement-content-editor.tsx:27-31 — Editor has explicit Save, supports reorder.
- Fix: Match autosave timing or document intentional dirty-save change.

## G2-17-022-007  [P3] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:61-62 — Unavailable option appends `(not enough data yet)`.
- vNext now: src/components/placements/tpo-public-placement-content-editor.tsx:66-72 — Help line says small/unavailable values hidden.
- Fix: Show per-option suppression suffix on checkbox.

## G2-17-022-016  [P3] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:55-57 — About rows=4, 4000 max, showCount, Save disabled unchanged.
- vNext now: src/components/placements/tpo-public-placement-content-editor.tsx:58-64 — Textarea rows=5, 4000 max, count below.
- Fix: Set rows4 and legacy counter style/placement.

## G2-17-022-040  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/settings/PlacementsPageSettings.jsx:62 — Suffix `(not enough data yet)` exact.
- vNext now: src/components/placements/tpo-public-placement-content-editor.tsx:66-72 — Help summary without per-option suffix.
- Fix: Reproduce label-level suffix.
