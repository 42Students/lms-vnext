# Work packet (wave 2): edit src/app/api/colleges/[collegeId]/branding/logo/route.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md, docs/audit/gap2/lane-2/l15-u020-college-branding.md, docs/audit/gap2/lane-9/superadmin-college-branding.md

## G2-10-027-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:52-56 — Global /api/v1/upload gateway for all folders/file operations.
- vNext now: src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:20-56; src/app/api/colleges/[collegeId]/branding/logo/route.ts:10-51 — Routes split by assignment and college branding resource.
- Fix: Document endpoint-to-feature migration and avoid broken old upload clients

## G2-10-027-024  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:1603-1614 — Multipart fallback file/folder/type/binding IDs.
- vNext now: src/app/api/colleges/[collegeId]/branding/logo/route.ts:10-20 — Branding multipart only file, collegeId in URL.
- Fix: Adjust upload form payload for scoped endpoints

## G2-10-027-063  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:1603-1614 — Mobile direct/slow connection can use multipart fallback.
- vNext now: src/app/api/colleges/[collegeId]/branding/logo/route.ts:10-30; src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts:20-56 — Only branding multipart.
- Fix: Ensure mobile CORS/network fallback supported

## G2-10-027-076  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:478-492 — Branding upload cap5MiB protects login performance.
- vNext now: src/app/api/colleges/[collegeId]/branding/logo/route.ts:10-30 — Separate branding handler buffers/proxies file.
- Fix: Verify raw cap and derived thumbnail/cache behavior

## G2-15-020-049  [P2] GAP  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-169 R2 cropping image upload
- vNext now: src/app/api/colleges/[collegeId]/branding/logo/route.ts:1-130 signed logo upload
- Fix: Compare file format/size/crop rules and preview.

## G2-9-030-040  [P2] GAP  facet F10  effort L
- Legacy: R2 crop upload via BrandingImageUpload `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-169`
- vNext now: FormData POST to college branding/logo API `src/app/api/colleges/[collegeId]/branding/logo/route.ts:9-30` `src/components/admin/college-logo-uploader.tsx:50-82`
- Fix: Document storage migration and object lifecycle

## G2-9-030-063  [P2] GAP  facet F21  effort L
- Legacy: R2 deletion and TenantAdmin branding API `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:4-7,97-109`
- vNext now: New logo API, versioned DB event `src/app/api/colleges/[collegeId]/branding/logo/route.ts:9-69` `src/modules/colleges/branding-service.ts:126-175`
- Fix: Map old R2 references to new storage
