# Work packet (wave 3): edit src/modules/courses/lesson-resource-materials-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md

## G2-17-008-072  [P0] MISSING  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:31-35 — R2 private-bucket presigned URL integration.
- vNext now: src/modules/courses/lesson-resource-materials-service.ts:51-52 — Signed grant remains planned.
- Fix: Wire secure object-storage signing and prohibit public URLs.

## G2-17-008-043  [P1] MISSING  facet F11  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:85-92 — File grant checks tenant org, college, course and optional class.
- vNext now: src/modules/courses/lesson-resource-materials-service.ts:24-31 — Materials read auth, no grant implemented.
- Fix: Enforce same and stronger checks before file signing.
