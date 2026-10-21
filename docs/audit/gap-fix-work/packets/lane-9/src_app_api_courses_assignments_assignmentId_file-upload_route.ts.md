# Work packet: edit src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md

## G2-10-027-002  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:421-422 — POST /presign mints R2 URL for any allowed folder.
- vNext now: src/modules/storage/file-lifecycle.ts:68-95; src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:20-52 — Presign exposed only by feature-specific grant routes.
- Fix: Map legacy folder/type to dedicated create-upload grants

## G2-10-027-037  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:421-422 — POST /api/v1/upload/presign.
- vNext now: src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:20-56 — POST /api/courses/assignments/:id/file-upload.
- Fix: Document endpoint transform and response contract

## G2-10-027-031  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:695-701 — Presign returns usable upload URL, no UI toast in controller.
- vNext now: src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:50-53 — HTTP201 {grant}; client shows upload progress.
- Fix: Map success receipt and status copy
