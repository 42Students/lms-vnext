# Work packet: edit src/db/schema/lesson-content-materials.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md

## G2-17-008-073  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:91-132 — ResourceComposer calls uploadResourceFile to R2.
- vNext now: src/db/schema/lesson-content-materials.ts:24-45 — New DB models scan attestations but no file uploader here.
- Fix: Complete upload/scan attestation/grant workflow.

## G2-17-008-074  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:61-64 — Resource JSON embeds FILE/LINK materials with title/url/fileDTO.
- vNext now: src/db/schema/lesson-content-materials.ts:7-35 — Relational normalized fields + statuses.
- Fix: Map all legacy JSON arrays and metadata into material rows.

## G2-17-008-075  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:105-115 — Object key prefixed by org/college and lesson-content.
- vNext now: src/db/schema/lesson-content-materials.ts:14-18 — StorageKey unique but prefix not enforced by DB.
- Fix: Enforce tenant prefix at write and grant, not merely uniqueness.
