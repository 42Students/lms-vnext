# Work packet (wave 2): edit src/modules/storage/file-lifecycle.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md

## G2-10-027-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:421-709 — Presign validates, resolves tenant folder, signs URL in one controller.
- vNext now: src/modules/storage/file-policy.ts:157-190; src/modules/storage/file-lifecycle.ts:77-95 — Policy and grant service separated.
- Fix: Match field order/flow and guard visibly at upload UI

## G2-10-027-012  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:695-701 — Response uploadUrl,key,publicUrl,receiptId.
- vNext now: src/modules/storage/file-lifecycle.ts:68-95 — Returns objectKey, uploadUrl, method, expiresAt, requiredHeaders, uploadTokenHash.
- Fix: Adjust clients to new response and private URL model

## G2-10-027-053  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:685-692 — Private store unavailable and presign failure distinct.
- vNext now: src/modules/storage/file-lifecycle.ts:42-50; src/modules/storage/private-object-storage.ts:47-75 — Storage error mapping to not configured/size invalid.
- Fix: Distinguish credential outage from invalid input

## G2-10-027-055  [P2] MISSING  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:756-761 — Import fetch429 if 20/hour exceeded.
- vNext now: src/modules/storage/file-lifecycle.ts:68-95 — URL import missing and no loading/error state.
- Fix: Add import progress, rate limit error, Retry

## G2-10-027-056  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:421-709 — Signed upload R2 URL with optional publicURL.
- vNext now: src/modules/storage/file-lifecycle.ts:68-95 — Private signed URL with required headers.
- Fix: Map upload instruction and avoid leaking public URLs

## G2-10-027-059  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:2290-2371 — StreamFile emits content inline for safe type.
- vNext now: src/modules/storage/file-lifecycle.ts:1-25 — GET signed private stream/grants through object storage.
- Fix: Keep content-disposition/mime protections
