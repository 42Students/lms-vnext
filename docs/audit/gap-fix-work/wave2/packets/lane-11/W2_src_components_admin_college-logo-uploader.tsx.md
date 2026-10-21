# Work packet (wave 2): edit src/components/admin/college-logo-uploader.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-college-branding.md

## G2-9-030-011  [P2] GAP  facet F03  effort M
- Legacy: Cropped image uploader embedded in Logo field `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-169`
- vNext now: Separate crop sliders and Crop and upload logo button `src/components/admin/college-logo-uploader.tsx:92-120`
- Fix: Embed uploader/crop controls under Logo

## G2-9-030-040  [P2] GAP  facet F10  effort L
- Legacy: R2 crop upload via BrandingImageUpload `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-169`
- vNext now: FormData POST to college branding/logo API `src/app/api/colleges/[collegeId]/branding/logo/route.ts:9-30` `src/components/admin/college-logo-uploader.tsx:50-82`
- Fix: Document storage migration and object lifecycle
