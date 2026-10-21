# Work packet (wave 2): edit src/db/schema/course-upload-receipts-staged.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u021-assignment-upload-receipt.md

## G2-12-021-004  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AssignmentUploadReceipt.java:17-19 receipt_id unique varchar(64)
- vNext now: src/db/schema/course-upload-receipts-staged.ts:18-18 id UUID primary key, upload token SHA-256 at 26
- Fix: Explicitly map legacy opaque receipt string to UUID and migrate reference IDs if import is ever required

## G2-12-021-005  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AssignmentUploadReceipt.java:21-26 storage_key <=1024 and public_url <=2048
- vNext now: src/db/schema/course-upload-receipts-staged.ts:25-27 objectKey text and originalName text; no publicUrl
- Fix: Document deliberate private-only URL removal and ensure legacy public_url readers use signed download grants

## G2-12-021-006  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AssignmentUploadReceipt.java:31-35 folder and upload_type varchar(80)
- vNext now: src/db/schema/course-upload-receipts-staged.ts:21-24 purpose enum-like text + lessonContentId/assignmentId delivery target
- Fix: Implement explicit folder/type mapping (`assignment` and `lesson-content` to purpose) for parity checks

## G2-12-021-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AssignmentUploadReceipt.java:44-45 lesson_content_id integer
- vNext now: src/db/schema/course-upload-receipts-staged.ts:22-24 lessonContentId UUID and separate assignmentId/deliveryId UUID
- Fix: Map old lesson-content id to current assignment/delivery id; reject ambiguous tenant mappings

## G2-12-021-009  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AssignmentUploadReceipt.java:48-57 declared/actual MIME varchar(255) and size Long
- vNext now: src/db/schema/course-upload-receipts-staged.ts:28-34 declared mime text max128 via CHECK, actual size integer max50MiB
- Fix: Constrain max type/size in upload forms and record incompatible legacy file entries as exceptions

## G2-12-021-023  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AssignmentUploadReceipt.java:62-65 expires_at nullable, consumed_at nullable
- vNext now: src/db/schema/course-upload-receipts-staged.ts:30,38 expiresAt NOT NULL, consumedAt nullable, max15-minute CHECK at 73
- Fix: Use 15-minute vNext grant TTL, record intentional incompatibility with legacy receipts and DB policy

## G2-12-021-036  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37 integer id, created_at, updated_at, is_deleted default false inherited
- vNext now: src/db/schema/course-upload-receipts-staged.ts:18,40-49 UUID id, revoked, deletedAt and audit actor; no Boolean is_deleted
- Fix: Retain soft-delete filtering in every vNext read and describe migration mapping

## G2-12-021-037  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AssignmentUploadReceipt.java:17-66 includes owner_user_type, public_url, folder, upload_type, student_assignment_id
- vNext now: src/db/schema/course-upload-receipts-staged.ts:18-50 uses purpose, ownerMembershipId, submission link, hash and scan/retention fields
- Fix: Create complete column-level legacy→vNext data mapping; intentionally drop public URL

## G2-12-021-038  [P2] GAP  facet F22  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AssignmentUploadReceipt.java:17-19 unique receipt_id max64; docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AssignmentUploadReceiptRepository.java:15-17 by ID/key
- vNext now: src/db/schema/course-upload-receipts-staged.ts:52-65 unique objectKey and attestation; UUID ID primary key, no legacy receipt_id
- Fix: Provide legacy receipt-id reconciliation only if migrating receipts; otherwise mark no migration by design
