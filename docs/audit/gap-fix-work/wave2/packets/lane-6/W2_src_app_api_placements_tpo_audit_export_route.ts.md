# Work packet (wave 2): edit src/app/api/placements/tpo/audit/export/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md

## G2-11-006-054  [P2] GAP  facet F14  effort M
- Legacy: Shared grid offers CSV/XLSX visible/selected export, with hidden About/Detail in export. `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:37`
- vNext now: Server CSV only, exporting query across pages, no XLSX link in header. `src/app/api/placements/tpo/audit/export/route.ts:7`
- Fix: Restore XLSX, selected rows and column export parity.
