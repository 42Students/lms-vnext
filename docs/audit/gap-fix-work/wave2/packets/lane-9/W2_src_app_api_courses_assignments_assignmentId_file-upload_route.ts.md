# Work packet (wave 2): edit src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md, docs/audit/gap2/lane-8/l12-u021-assignment-upload-receipt.md

## G2-10-027-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:52-56 — Global /api/v1/upload gateway for all folders/file operations.
- vNext now: src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:20-56; src/app/api/colleges/[collegeId]/branding/logo/route.ts:10-51 — Routes split by assignment and college branding resource.
- Fix: Document endpoint-to-feature migration and avoid broken old upload clients

## G2-10-027-009  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:1603-1780 — Backend multipart upload alternate path.
- vNext now: src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:20-56 — Grant route only; browser uploads direct to signed R2.
- Fix: Provide clear CORS failure recovery without pretending success

## G2-10-027-021  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:421-422 — Presign JSON requires folder,type,filename,content-type,content-length.
- vNext now: src/modules/storage/file-policy.ts:137-169; src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:20-49 — Resource-specific file declaration and assignmentId route.
- Fix: Map form fields and defaults exactly

## G2-10-027-063  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:1603-1614 — Mobile direct/slow connection can use multipart fallback.
- vNext now: src/app/api/colleges/[collegeId]/branding/logo/route.ts:10-30; src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:20-56 — Only branding multipart.
- Fix: Ensure mobile CORS/network fallback supported

## G2-10-027-090  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:1603-1780 — Legacy server-proxy multipart fallback.
- vNext now: src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:20-56 — Assignment grant only; branding local upload preserved.
- Fix: Implement any needed fallback

## G2-12-021-025  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:457-459 returns 503 if receipt repository/storage disabled
- vNext now: src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:30-36 returns 503 DB06_ASSIGNMENT_FILES_MIGRATIONS_PENDING when storage unavailable
- Fix: Align human-facing configuration outage text and ops recovery instructions
