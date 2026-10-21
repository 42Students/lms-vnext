# Work packet: edit src/modules/courses/assignment-file-validation.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u021-assignment-upload-receipt.md

## G2-12-021-011  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:345-351 asset file DTO + uploadReceiptId mandatory
- vNext now: src/modules/courses/assignment-file-validation.ts:77-85 single uploadReceiptId UUID and FILE submission type
- Fix: Support multiple upload receipts under one submission in frontend/API with stable asset order
