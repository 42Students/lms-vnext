# Work packet: edit src/db/schema/course-upload-receipts-staged.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u021-assignment-upload-receipt.md

## G2-12-021-007  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AssignmentUploadReceipt.java:37-42 owner_user_id integer; owner_user_type varchar(40)
- vNext now: src/db/schema/course-upload-receipts-staged.ts:19-20 collegeId UUID and ownerMembershipId UUID; 47 creator UUID
- Fix: Bind owner membership and tenant when resolving legacy learner vs faculty identities

## G2-12-021-027  [P1] GAP  facet F14  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:429-451 accepts multiple file receipts
- vNext now: src/db/schema/course-upload-receipts-staged.ts:84-104 normalized per-file rows support sequences though src/modules/courses/assignment-submission-service.ts:388-397 only writes 0
- Fix: Enable multi-file producer and UI on already normalized relation
