# Work packet: edit src/modules/placements/tpo-drive-tab-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid.md

## G2-11-010-007  [P1] GAP  facet F02  effort M
- Legacy: Six AntD Tabs are a single horizontal strip within detail page. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:459`
- vNext now: Route tab model has 7 entries; workspace root itself is long-form page. `src/modules/placements/tpo-drive-tab-model.ts:4`
- Fix: Render exact tab strip and active/hover style on every workspace route.
