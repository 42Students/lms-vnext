# Work packet (wave 2): edit src/modules/courses/lesson-resource-materials-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md

## G2-17-008-047  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:158-172 — Composer refuses blank title/no attachments or notes/class missing.
- vNext now: src/modules/courses/lesson-resource-materials-model.ts:5-24 — Only per-link title and valid HTTPS constraints.
- Fix: Validate full Resource parent create conditions.
