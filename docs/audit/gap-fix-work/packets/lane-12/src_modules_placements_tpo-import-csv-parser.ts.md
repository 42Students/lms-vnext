# Work packet: edit src/modules/placements/tpo-import-csv-parser.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-7-036-027  [P3] GAP  facet F07  effort S
- Legacy: bulkCsvParse.js:38 Unclosed quoted field in CSV
- vNext now: tpo-import-csv-parser.ts:34 Unclosed quoted field in import CSV.
- Fix: Align user-facing parser errors per uploader
