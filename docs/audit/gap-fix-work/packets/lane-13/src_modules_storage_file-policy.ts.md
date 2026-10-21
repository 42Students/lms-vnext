# Work packet: edit src/modules/storage/file-policy.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md, docs/audit/gap2/lane-20/r2-storage-utils.md

## G2-10-027-010  [P1] GAP  facet F03  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:160-174 — 11 allowed folders: lesson-content, profile-images, video-intros, resumes, assignments, course-images, identity-docs, marksheets, college-branding, offer-letters, jd-files.
- vNext now: src/modules/storage/file-policy.ts:13-18; src/modules/storage/private-object-storage.ts:14-20 — VNext private namespaces profile-verification, assignment, course-resource, project-resource, video.
- Fix: Document folder-to-namespace translation for all 11 folders

## G2-10-027-014  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:139-155 — Limits video 5120MB, lecture50MB, ppt100MB, pdf50MB, image10MB, generic50MB.
- vNext now: src/modules/storage/file-policy.ts:20-22,83-103 — VNext video4900MiB, documents50MiB, thumbnails5MiB.
- Fix: Document each type-specific cap and errors

## G2-10-027-015  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:167-174 — Folder limits branding/profile/course images5MiB, offer letter10MiB, JD/marksheet5MiB.
- vNext now: src/modules/storage/file-policy.ts:20-22,83-103; src/app/api/colleges/[collegeId]/branding/logo/route.ts:10-30 — Generic storage policy lacks legacy folder caps; branding has separate handler.
- Fix: Enforce old per-folder cap in each dedicated route

## G2-10-027-027  [P1] GAP  facet F07  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:493-509 — JD PDFs/Word only; offer letter PDF/PNG/JPG only.
- vNext now: src/modules/storage/file-policy.ts:31-55 — General document allowlist contains more types.
- Fix: Enforce JD/offer-specific MIME restrictions

## G2-10-027-050  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:167-174 — Folder cap5MiB for JD/branding/marksheet and10MiB for offers.
- vNext now: src/modules/storage/file-policy.ts:20-22 — General cap50MiB unless feature-specific validation.
- Fix: Enforce semantic folder limits

## G2-10-027-025  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:443-454 — Reject negative and zero size with distinct copy.
- vNext now: src/modules/storage/file-policy.ts:157-185; src/modules/storage/ui-models.ts:133-136 — Generic STORAGE_SIZE_INVALID UI message.
- Fix: Restore zero-v-negative specific errors at affected form

## G2-20-009-021  [P2] GAP  facet F07  effort S
- Legacy: Legacy resource oversize error 400 with text 'between 1 byte and configured size limit'; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceUploadController.java:82-84`
- vNext now: New above cap STORAGE_FILE_TOO_LARGE 413, zero size STORAGE_SIZE_INVALID 400; `src/modules/storage/file-policy.ts:177-183`, `src/modules/storage/file-errors.ts:12-13`
- Fix: Update API clients to handle status 413 instead of 400 and display numeric 50MiB limit.

## G2-20-009-020  [P3] GAP  facet F07  effort S
- Legacy: Legacy Resource presign invalid MIME uses text 'Unsupported Resource file name or MIME type'; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceUploadController.java:74-81`
- vNext now: New separate STORAGE_NAME_INVALID/TYPE_NOT_ALLOWED/EXTENSION_MISMATCH 400; `src/modules/storage/file-policy.ts:157-184`, `src/modules/storage/file-errors.ts:9-11`
- Fix: Make errors field-specific while preserving legacy message mapping for known operations.
