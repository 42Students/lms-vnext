# Work packet: edit src/modules/storage/file-lifecycle.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md

## G2-10-027-002  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:421-422 — POST /presign mints R2 URL for any allowed folder.
- vNext now: src/modules/storage/file-lifecycle.ts:68-95; src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:20-52 — Presign exposed only by feature-specific grant routes.
- Fix: Map legacy folder/type to dedicated create-upload grants

## G2-10-027-004  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:2180-2185,2236-2241,2290-2291 — Download/Get/Stream by fileName.
- vNext now: src/modules/storage/file-access.ts:8-26; src/modules/storage/file-lifecycle.ts:1-25 — Grant/read are feature-scoped, no generic fileName URL.
- Fix: Provide feature-specific read and legacy file reference adapter

## G2-10-027-042  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:2180-2390 — GET download/get/stream + DELETE /file/delete.
- vNext now: src/modules/storage/file-access.ts:8-26; src/modules/storage/file-lifecycle.ts:1-25 — Reads/deletes owned resource, not arbitrary filename API.
- Fix: Cover all legacy read modes with scoped grants

## G2-10-027-032  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:2207-2216 — Download returns publicUrl in Response(HttpStatus.OK) wrapper.
- vNext now: src/modules/storage/file-access.ts:8-26; src/modules/storage/file-lifecycle.ts:20-24 — Authorization/read grant returns private URL, different payload.
- Fix: Use private signed read URL without misrepresenting public URL

## G2-10-027-029  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:437-441 — R2 unconfigured returns 503 'R2 storage is not configured'.
- vNext now: src/modules/storage/ui-models.ts:127-148; src/modules/storage/file-lifecycle.ts:42-50 — STORAGE_NOT_CONFIGURED 'File storage is not available right now'.
- Fix: Preserve clear provider-down message for support
