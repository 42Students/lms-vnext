# Work packet: edit src/modules/placements/tpo-academic-preview-import-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md

## G2-14-001-024  [P1] GAP  facet F06  effort L
- Legacy: Legacy academic import by roll, sparse academic columns; vNext mandatory UUID studentCode,cgpa,activeBacklogs — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:530-561,593-605`
- vNext now: `src/components/tpo/tpo-academic-import-workspace.tsx:110-126`; `src/modules/placements/tpo-academic-preview-import-model.ts:32-69`
- Fix: Support roll lookup and all sparse marks/year/gap/gender/batch fields

## G2-14-001-028  [P2] GAP  facet F07  effort M
- Legacy: Legacy missing/duplicate roll annotated on individual unmatched row; vNext duplicate ID errors whole CSV — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:532-547`
- vNext now: `src/modules/placements/tpo-academic-preview-import-model.ts:52-67`; `src/components/tpo/tpo-academic-import-workspace.tsx:59-75`
- Fix: Report per-row duplicate/missing roll in Can't match and offer row skip

## G2-14-001-029  [P2] GAP  facet F07  effort M
- Legacy: Legacy academic validators CGPA0-10, marks0-100, gap0-15 and year1980-2100 with explicit error; vNext only CGPA0-10/backlogs0-100 — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:564-577`
- vNext now: `src/modules/placements/tpo-academic-preview-import-model.ts:3-7,60-65`
- Fix: Implement full value bounds and original field-specific messages

## G2-14-001-030  [P2] GAP  facet F07  effort M
- Legacy: Legacy .xlsx/.csv errors + >5000 rows; vNext .csv only, max200 rows, 200KB error — `docs/legacy-source/frontend/src/components/tpo/ImportPreviewModal.js:65-110`
- vNext now: `src/components/tpo/tpo-academic-import-workspace.tsx:37-49`; `src/modules/placements/tpo-academic-preview-import-model.ts:32-36`
- Fix: Align file formats and error strings after format/parser parity
