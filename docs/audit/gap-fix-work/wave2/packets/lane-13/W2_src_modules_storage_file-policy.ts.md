# Work packet (wave 2): edit src/modules/storage/file-policy.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md, docs/audit/gap2/lane-20/r2-storage-utils.md, docs/audit/gap2/lane-6/cross-06-files-uploads-media-storage.md, docs/audit/gap2/lane-6/resource-upload-controller.md

## G2-10-027-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:421-709 — Presign validates, resolves tenant folder, signs URL in one controller.
- vNext now: src/modules/storage/file-policy.ts:157-190; src/modules/storage/file-lifecycle.ts:77-95 — Policy and grant service separated.
- Fix: Match field order/flow and guard visibly at upload UI

## G2-10-027-016  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:576-657 — Typed MIME checks video/lecture/ppt/pdf/image/resume/generic.
- vNext now: src/modules/storage/file-policy.ts:31-74,83-103 — Allowlist by namespace and extension, not legacy 'type'.
- Fix: Create explicit legacy type compatibility matrix

## G2-10-027-021  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:421-422 — Presign JSON requires folder,type,filename,content-type,content-length.
- vNext now: src/modules/storage/file-policy.ts:137-169; src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:20-49 — Resource-specific file declaration and assignmentId route.
- Fix: Map form fields and defaults exactly

## G2-10-027-064  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:139-155 — Browser video input can select up to5GiB.
- vNext now: src/modules/storage/file-policy.ts:20-22,61-67 — Limit4900MiB.
- Fix: Show changed max before selecting file

## G2-10-027-066  [P2] MISSING  facet F17  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:739-824 — URL input previously accessible as distinct upload method.
- vNext now: src/modules/storage/file-policy.ts:13-18 — No URL import UI contract.
- Fix: Restore accessible URL entry alternative

## G2-20-009-011  [P2] GAP  facet F04  effort S
- Legacy: inferSafeContentType supports pdf, jpg/jpeg, png, gif, webp, mp4/webm/mov, ppt/pptx/doc/docx; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:71-92`
- vNext now: Per-kind policy accepts extra xls/xlsx/txt/csv/rtf/zip, no GIF among images; `src/modules/storage/file-policy.ts:29-74`
- Fix: Publish per-file-kind accept/mime matrix and migrate old GIF uploads or show unsupported-type handling.

## G2-20-009-041  [P2] GAP  facet F14  effort S
- Legacy: Legacy generic document uploads cap50MiB and video5GiB in FileUploadController; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:139-149`
- vNext now: New document50MiB, video4900MiB, thumbnail5MiB, count cap10/200/50; `src/modules/storage/file-policy.ts:20-27`
- Fix: Update accept/size help and reject >4900MiB video before presign rather than vague failure.

## G2-6-032-012  [P2] GAP  facet F04  effort S
- Legacy: Legacy video duration client supplied, 0 default (file-and-video-storage.md:17).
- vNext now: vNext durationSeconds optional 1..86400, no probing (file-and-video-storage.md:17,62-63; file-policy.ts:26-27).
- Fix: Align duration placeholder/default and legacy zero handling in video form.

## G2-6-025-011  [P2] GAP  facet F04  effort M
- Legacy: Resource key prefix org-{id}/college-{id}/lesson-content/course-{id}/class-{id?}/user-{id}/ (ResourceUploadController.java:45-55).
- vNext now: VNext private namespace uses college/member and feature kind (file-lifecycle.ts:77-103; file-policy.ts:13-18).
- Fix: Persist course+delivery ownership in metadata and enforce same-tenant object key prefix.
