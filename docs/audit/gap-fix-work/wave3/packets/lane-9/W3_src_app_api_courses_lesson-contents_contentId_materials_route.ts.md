# Work packet (wave 3): edit src/app/api/courses/lesson-contents/[contentId]/materials/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md

## G2-17-008-037  [P0] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:68-91 — GET signed file grant /api/v1/resource-files/{id}/materials/{index}/url.
- vNext now: src/app/api/courses/lesson-contents/[contentId]/materials/route.ts:20-26 — GET only material metadata, not download URL.
- Fix: Add authorised per-material signed grant and wire Open.
