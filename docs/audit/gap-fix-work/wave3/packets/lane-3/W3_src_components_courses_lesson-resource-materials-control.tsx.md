# Work packet (wave 3): edit src/components/courses/lesson-resource-materials-control.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md

## G2-17-008-019  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:230-255 — Composer captures parent title, scope, notes, multiple FILEs and LINKs.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:105-125 — Editor only captures per-material title, URL, notes.
- Fix: Provide full Resource composer with files and parent metadata.

## G2-17-008-053  [P1] MISSING  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:91-132 — Uploads multiple selected local files to R2, enforces limits.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:105-125 — Only link creation UI.
- Fix: Add multi-file uploading/verification lifecycle.
