# Work packet: edit src/modules/storage/file-errors.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/r2-storage-utils.md

## G2-20-009-018  [P2] GAP  facet F07  effort S
- Legacy: Legacy upload exceptions propagate IOException/AmazonClientException/RuntimeException directly; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:52-63,145-155`
- vNext now: New public storage codes include STORAGE_NOT_CONFIGURED 503, STORAGE_SIZE_INVALID 400, UPLOAD_MISMATCH 422, NOT_FOUND 404; `src/modules/storage/file-errors.ts:5-26`
- Fix: Provide action-specific friendly error mappings, not raw AWS error text.

## G2-20-009-021  [P2] GAP  facet F07  effort S
- Legacy: Legacy resource oversize error 400 with text 'between 1 byte and configured size limit'; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceUploadController.java:82-84`
- vNext now: New above cap STORAGE_FILE_TOO_LARGE 413, zero size STORAGE_SIZE_INVALID 400; `src/modules/storage/file-policy.ts:177-183`, `src/modules/storage/file-errors.ts:12-13`
- Fix: Update API clients to handle status 413 instead of 400 and display numeric 50MiB limit.

## G2-20-009-019  [P3] GAP  facet F07  effort S
- Legacy: Resource presign missing R2 returns 503 'Resource storage is unavailable'; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceUploadController.java:68-70`
- vNext now: New STORAGE_NOT_CONFIGURED 503 code; `src/modules/storage/file-errors.ts:25`
- Fix: UI should map STORAGE_NOT_CONFIGURED to same user-friendly unavailable notice if strict copy parity.

## G2-20-009-020  [P3] GAP  facet F07  effort S
- Legacy: Legacy Resource presign invalid MIME uses text 'Unsupported Resource file name or MIME type'; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceUploadController.java:74-81`
- vNext now: New separate STORAGE_NAME_INVALID/TYPE_NOT_ALLOWED/EXTENSION_MISMATCH 400; `src/modules/storage/file-policy.ts:157-184`, `src/modules/storage/file-errors.ts:9-11`
- Fix: Make errors field-specific while preserving legacy message mapping for known operations.
