# Work packet (wave 2): edit src/db/schema/storage-files.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md, docs/audit/gap2/lane-6/cross-06-files-uploads-media-storage.md

## G2-10-027-005  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:2372-2373 — DELETE /file/delete with path param.
- vNext now: src/db/schema/storage-files.ts:80-83,197-199 — Soft-delete metadata by file domain.
- Fix: Map legacy delete contract to allowed resource endpoints

## G2-10-027-017  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:683-689 — Key <tenant>/<folder>/user-ID or project-ID/<uuid>.<extension>.
- vNext now: src/modules/storage/private-object-storage.ts:85-95; src/db/schema/storage-files.ts:138-140 — Private/<collegeUUID>/<membershipUUID>/<namespace>/<uuid> paths.
- Fix: Store mapping from legacy object keys; don't infer from UUID

## G2-10-027-018  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:710-736 — AssignmentUploadReceipt expires presign+30m.
- vNext now: src/db/schema/storage-files.ts:61-83 — Per-file uploadExpiresAt and status instead of anonymous receipt.
- Fix: Map old receipt lifecycle to verified file states

## G2-10-027-077  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:711-736 — Receipts expire after15+30m.
- vNext now: src/db/schema/storage-files.ts:61-83 — File row upload expiry and status transition.
- Fix: Reconcile staged receipt TTL, failed uploads

## G2-6-032-071  [P2] GAP  facet F22  effort M
- Legacy: Legacy key org-{id}/college-{id}/lesson-content/.../user-{id}/ extension (ResourceUploadController.java:45-55,116-118).
- vNext now: vNext private/<collegeUUID>/<membershipUUID>/<namespace>/<objectUUID>; DB CHECK enforces prefix (private-object-storage.ts:116-126; storage-files.ts:137-151,248-254).
- Fix: Map old R2 keys/links if ever read legacy archives; do not treat string keys as vNext IDs.
