# Work packet: edit src/modules/storage/ui-models.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md

## G2-10-027-025  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:443-454 — Reject negative and zero size with distinct copy.
- vNext now: src/modules/storage/file-policy.ts:157-185; src/modules/storage/ui-models.ts:133-136 — Generic STORAGE_SIZE_INVALID UI message.
- Fix: Restore zero-v-negative specific errors at affected form

## G2-10-027-029  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:437-441 — R2 unconfigured returns 503 'R2 storage is not configured'.
- vNext now: src/modules/storage/ui-models.ts:127-148; src/modules/storage/file-lifecycle.ts:42-50 — STORAGE_NOT_CONFIGURED 'File storage is not available right now'.
- Fix: Preserve clear provider-down message for support

## G2-10-027-033  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:239-280 — Authorization failure explicit 'Upload is only allowed for your own profile'.
- vNext now: src/modules/storage/ui-models.ts:127-148 — Generic 'You do not have permission to do this'.
- Fix: Match actionable permission text without data leakage
