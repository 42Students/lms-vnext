# Work packet: edit src/modules/placements/tpo-configuration-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md

## G2-3-011-019  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:41-47`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:140-142`
- vNext now: `src/modules/placements/tpo-configuration-model.ts:6-8`, `src/components/tpo/tpo-job-types-editor.tsx:43-55`
- Fix: Legacy accepts 2-40 letters/digits/basic ASCII punctuation after collapsing whitespace; vNext also allows combining marks, rejects punctuation-only, and does not collapse interior spaces. Align normalization and pattern.

## G2-3-011-020  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:41-47`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:140-143`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:32-39`, `src/modules/placements/tpo-configuration-model.ts:6-8`
- Fix: Legacy exact duplicate error uses quoted offending name; vNext generic This job type already exists. Preserve field-level legacy message.
