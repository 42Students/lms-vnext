# Work packet: edit src/modules/courses/assignment-file-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u021-assignment-upload-receipt.md

## G2-12-021-013  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:462-478 distinct invalid/used/expired/key/owner/assignment messages
- vNext now: src/modules/courses/assignment-file-service.ts:233-242 maps all bad receipt states to ASSIGNMENT_UPLOAD_RECEIPT_INVALID
- Fix: Use precise legacy error cases in response mapping while preserving no-ID-leak security

## G2-12-021-014  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:480-491 differentiates file missing, empty and declared size mismatch
- vNext now: src/modules/courses/assignment-file-service.ts:246-272 maps attestation mismatch to generic invalid receipt, absent to ASSIGNMENT_FILE_NOT_READY
- Fix: Separate missing object, zero length, MIME mismatch, size mismatch and retryable not-ready messages
