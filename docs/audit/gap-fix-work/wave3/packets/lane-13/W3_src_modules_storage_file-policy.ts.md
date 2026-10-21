# Work packet (wave 3): edit src/modules/storage/file-policy.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md

## G2-10-027-007  [P1] MISSING  facet F02  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:739-824 — Import-file-from-url runs server-side fetch+R2 upload.
- vNext now: src/modules/storage/file-policy.ts:13-18; src/modules/storage/file-lifecycle.ts:68-95 — Namespaces only assignment/project/video, no shared URL importer.
- Fix: Design scoped URL-import flow only if retained by product owner

## G2-10-027-008  [P1] MISSING  facet F02  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:830-907,908-969 — Import video and validate-video-url endpoints.
- vNext now: src/modules/storage/file-policy.ts:61-67; src/modules/storage/file-lifecycle.ts:68-95 — Video-specific presigned PUT and verification, no URL-import counterpart.
- Fix: Restore permitted URL-import/validation UX or explicitly retire

## G2-10-027-040  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:830-907 — POST /api/v1/upload/import-video-from-url.
- vNext now: src/modules/storage/file-policy.ts:61-67; src/modules/storage/file-lifecycle.ts:68-95 — Upload only via signed PUT.
- Fix: Implement video URL import with SSRF rules or flag drop

## G2-10-027-041  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:908-969 — POST /api/v1/upload/validate-video-url.
- vNext now: src/modules/storage/file-policy.ts:61-67 — No remote URL validator.
- Fix: Restore preflight validation

## G2-10-027-089  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:739-969 — Legacy supports import file/video by URL and video validator.
- vNext now: src/modules/storage/file-policy.ts:13-18; src/modules/storage/file-lifecycle.ts:68-95 — New deliberately local/direct uploads only.
- Fix: Document owner decision rather than silently drop imports

## G2-10-027-023  [P2] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:830-831,908-909 — Video URL import and validate preview separate actions.
- vNext now: src/modules/storage/file-policy.ts:61-67 — Video upload supports local file declaration only.
- Fix: Reintroduce URL test and import action
