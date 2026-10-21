# Work packet (wave 3): edit src/modules/storage/file-lifecycle.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md

## G2-10-027-007  [P1] MISSING  facet F02  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:739-824 — Import-file-from-url runs server-side fetch+R2 upload.
- vNext now: src/modules/storage/file-policy.ts:13-18; src/modules/storage/file-lifecycle.ts:68-95 — Namespaces only assignment/project/video, no shared URL importer.
- Fix: Design scoped URL-import flow only if retained by product owner

## G2-10-027-008  [P1] MISSING  facet F02  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:830-907,908-969 — Import video and validate-video-url endpoints.
- vNext now: src/modules/storage/file-policy.ts:61-67; src/modules/storage/file-lifecycle.ts:68-95 — Video-specific presigned PUT and verification, no URL-import counterpart.
- Fix: Restore permitted URL-import/validation UX or explicitly retire

## G2-10-027-022  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:739-740 — Import file form accepts URL, folder, type, userId/courseId/classId.
- vNext now: src/modules/storage/file-lifecycle.ts:68-95 — No URL-import request.
- Fix: Restore URL input and validator when API is implemented

## G2-10-027-039  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:739-824 — POST /api/v1/upload/import-file-from-url.
- vNext now: src/modules/storage/file-lifecycle.ts:68-95 — No general URL import.
- Fix: Retire only with explicit parity waiver

## G2-10-027-040  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:830-907 — POST /api/v1/upload/import-video-from-url.
- vNext now: src/modules/storage/file-policy.ts:61-67; src/modules/storage/file-lifecycle.ts:68-95 — Upload only via signed PUT.
- Fix: Implement video URL import with SSRF rules or flag drop

## G2-10-027-074  [P1] MISSING  facet F19  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:754-762,848-855 — URL imports limited20/hour per user.
- vNext now: src/modules/storage/file-lifecycle.ts:68-95 — No URL import feature or limiter.
- Fix: Add import limit if feature implemented

## G2-10-027-082  [P1] MISSING  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:739-824 — Backend fetch URL imports and writes remote file.
- vNext now: src/modules/storage/file-lifecycle.ts:1-25 — Private upload grants, no outbound import.
- Fix: Assess import trust boundary and SSRF protection

## G2-10-027-089  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:739-969 — Legacy supports import file/video by URL and video validator.
- vNext now: src/modules/storage/file-policy.ts:13-18; src/modules/storage/file-lifecycle.ts:68-95 — New deliberately local/direct uploads only.
- Fix: Document owner decision rather than silently drop imports
