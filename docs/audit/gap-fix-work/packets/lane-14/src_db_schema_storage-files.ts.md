# Work packet: edit src/db/schema/storage-files.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md

## G2-10-027-085  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:683-701 — Generic R2 key with folder/userId/projectId/UUID extension.
- vNext now: src/db/schema/storage-files.ts:61-73,138-140 — UUID member+college+namespace objectKey, token hash.
- Fix: Map legacy key to vNext asset/receipt IDs

## G2-10-027-086  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:711-736 — AssignmentUploadReceipt has receiptId, storageKey, publicUrl, ownerUserType.
- vNext now: src/db/schema/storage-files.ts:43-83 — Domain-owned file record with hash/generation/scan and status.
- Fix: Preserve legacy receipt lookups via translation
