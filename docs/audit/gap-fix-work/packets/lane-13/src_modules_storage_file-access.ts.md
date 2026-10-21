# Work packet: edit src/modules/storage/file-access.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md

## G2-10-027-004  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:2180-2185,2236-2241,2290-2291 — Download/Get/Stream by fileName.
- vNext now: src/modules/storage/file-access.ts:8-26; src/modules/storage/file-lifecycle.ts:1-25 — Grant/read are feature-scoped, no generic fileName URL.
- Fix: Provide feature-specific read and legacy file reference adapter

## G2-10-027-042  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:2180-2390 — GET download/get/stream + DELETE /file/delete.
- vNext now: src/modules/storage/file-access.ts:8-26; src/modules/storage/file-lifecycle.ts:1-25 — Reads/deletes owned resource, not arbitrary filename API.
- Fix: Cover all legacy read modes with scoped grants

## G2-10-027-026  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:465-475 — Invalid folder path vs unallowed folder distinct errors.
- vNext now: src/modules/storage/private-object-storage.ts:47-52; src/modules/storage/file-access.ts:8-26 — Namespace and unauthorized map to generic errors.
- Fix: Map client error copy without exposing unauthorized key

## G2-10-027-032  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:2207-2216 — Download returns publicUrl in Response(HttpStatus.OK) wrapper.
- vNext now: src/modules/storage/file-access.ts:8-26; src/modules/storage/file-lifecycle.ts:20-24 — Authorization/read grant returns private URL, different payload.
- Fix: Use private signed read URL without misrepresenting public URL
