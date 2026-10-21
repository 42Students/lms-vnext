# Work packet (wave 2): edit src/modules/courses/assignment-file-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u021-assignment-upload-receipt.md

## G2-12-021-021  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:149-183 checks caller identity and lesson/class eligibility
- vNext now: src/modules/courses/assignment-file-service.ts:49-100 requires active learner, same delivery and published learning path
- Fix: Document audience shift and re-test elective/class membership cases under vNext roster rules

## G2-12-021-031  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:463-491 has exact messages 'Upload receipt is expired.' and 'Uploaded file size does not match the upload receipt.'
- vNext now: src/modules/courses/assignment-file-service.ts:240-271 exposes service codes only
- Fix: Preserve detailed safe copy in shared UI error map

## G2-12-021-035  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AssignmentUploadReceipt.java:14-17 uses Spring JPA audit timestamps; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:479-495 external R2 object metadata
- vNext now: src/modules/courses/assignment-file-service.ts:125-139 private object grant and src/modules/courses/assignment-file-service.ts:246-259 object attestation
- Fix: Document S3/R2 metadata and scanner trust boundary; require persisted trusted scan timestamp
