# Work packet (wave 2): edit src/app/api/placements/tpo/students/academic-import/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md, docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-14-001-067  [P2] GAP  facet F19  effort L
- Legacy: Legacy importer 5000 rows; vNext parser max200 and request max200 — `docs/legacy-source/frontend/src/components/tpo/ImportPreviewModal.js:21-35`
- vNext now: `src/modules/placements/tpo-academic-preview-import-model.ts:32-36`; `src/app/api/placements/tpo/students/academic-import/route.ts:16-20`
- Fix: Support batching and accurate large-file previews

## G2-4-022-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy academic import response updated count. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:210-218`)
- vNext now: New API returns {preview} or {result} with detailed import rows. (`src/app/api/placements/tpo/students/academic-import/route.ts:16-25`)
- Fix: Retain visible updated count and per-row explanations.

## G2-4-022-039  [P2] GAP  facet F10  effort M
- Legacy: Legacy /academic-import/preview and /academic-import are separate POST endpoints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:210-218`)
- vNext now: New one POST with action PREVIEW/IMPORT and rows min1 max200. (`src/app/api/placements/tpo/students/academic-import/route.ts:11-25`)
- Fix: Migrate clients safely and preserve preview-before-apply flow.

## G2-4-022-048  [P3] GAP  facet F13  effort S
- Legacy: Legacy academic import can return updated0 on no rows. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:215-218`)
- vNext now: New rejects zero rows and displays validation error. (`src/app/api/placements/tpo/students/academic-import/route.ts:16-20`)
- Fix: Match empty-import explanation or approve safer new validation.
