# Work packet (wave 2): edit src/modules/placements/tpo-academic-preview-import-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md

## G2-14-001-052  [P2] GAP  facet F14  effort L
- Legacy: Legacy .xlsx/.csv 5000 row academic import; vNext CSV only 200 rows — `docs/legacy-source/frontend/src/components/tpo/ImportPreviewModal.js:65-90`
- vNext now: `src/components/tpo/tpo-academic-import-workspace.tsx:37-49,125-126`; `src/modules/placements/tpo-academic-preview-import-model.ts:32-36`
- Fix: Implement XLSX reader and chunked 5000-row processing

## G2-14-001-067  [P2] GAP  facet F19  effort L
- Legacy: Legacy importer 5000 rows; vNext parser max200 and request max200 — `docs/legacy-source/frontend/src/components/tpo/ImportPreviewModal.js:21-35`
- vNext now: `src/modules/placements/tpo-academic-preview-import-model.ts:32-36`; `src/app/api/placements/tpo/students/academic-import/route.ts:16-20`
- Fix: Support batching and accurate large-file previews
