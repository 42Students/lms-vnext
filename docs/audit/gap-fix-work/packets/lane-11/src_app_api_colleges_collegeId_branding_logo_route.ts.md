# Work packet: edit src/app/api/colleges/[collegeId]/branding/logo/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md, docs/audit/gap2/lane-9/superadmin-college-branding.md

## G2-10-027-003  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:1603-1614 — POST /file/upload multipart fallback.
- vNext now: src/app/api/colleges/[collegeId]/branding/logo/route.ts:10-30 — Branding accepts multipart; assignment route returns signed grant only.
- Fix: Add scoped fallback for blocked CORS if required

## G2-10-027-015  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:167-174 — Folder limits branding/profile/course images5MiB, offer letter10MiB, JD/marksheet5MiB.
- vNext now: src/modules/storage/file-policy.ts:20-22,83-103; src/app/api/colleges/[collegeId]/branding/logo/route.ts:10-30 — Generic storage policy lacks legacy folder caps; branding has separate handler.
- Fix: Enforce old per-folder cap in each dedicated route

## G2-10-027-038  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:1603-1614 — POST /api/v1/upload/file/upload multipart.
- vNext now: src/app/api/colleges/[collegeId]/branding/logo/route.ts:10-31 — POST /api/colleges/:id/branding/logo multipart only.
- Fix: Plan domain-specific fallback per type

## G2-10-027-057  [P1] GAP  facet F14  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:1603-1780 — Multipart server fallback for CORS.
- vNext now: src/app/api/colleges/[collegeId]/branding/logo/route.ts:10-30 — Only logo has multipart handler.
- Fix: Retain transport fallback for approved features

## G2-9-030-037  [P1] GAP  facet F10  effort L
- Legacy: deleteFileFromR2 called only after successful save `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:38-46,97-109`
- vNext now: Logo DELETE separated from branding Save `src/components/admin/college-logo-uploader.tsx:38-48` `src/app/api/colleges/[collegeId]/branding/logo/route.ts:9-30`
- Fix: Add deferred cleanup/staged mutation

## G2-9-030-050  [P1] GAP  facet F14  effort L
- Legacy: Deletes stale storage keys after successful Save `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:104-109`
- vNext now: Independent logo object deletion `src/app/api/colleges/[collegeId]/branding/logo/route.ts:38-60` `src/components/admin/college-logo-uploader.tsx:38-48`
- Fix: Prevent broken login if form Save abandoned
