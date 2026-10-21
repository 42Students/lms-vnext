# Work packet (wave 2): edit src/modules/colleges/bulk-import-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-7-036-040  [P2] GAP  facet F10  effort M
- Legacy: Colleges.js:250-255 returns per-college results and totals
- vNext now: colleges/bulk-import-model.ts:2-50 parsed rows and cap200
- Fix: Keep partial success report and row-level errors in service contract

## G2-7-036-081  [P2] GAP  facet F22  effort M
- Legacy: Colleges.js:250-255 per-college org/location results
- vNext now: colleges/bulk-import-model.ts:4-50 code/name/city/state/country with org from request
- Fix: Map address/organization uniqueness and row error outputs
