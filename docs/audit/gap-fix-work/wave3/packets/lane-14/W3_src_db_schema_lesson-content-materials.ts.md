# Work packet (wave 3): edit src/db/schema/lesson-content-materials.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md

## G2-17-008-020  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:9-11 — Up to 20 materials, each 50 MB, extension allowlist.
- vNext now: src/db/schema/lesson-content-materials.ts:37-46 — DB size/checks exist; no equivalent upload UI here.
- Fix: Complete allowed FILE upload and verification interface.
