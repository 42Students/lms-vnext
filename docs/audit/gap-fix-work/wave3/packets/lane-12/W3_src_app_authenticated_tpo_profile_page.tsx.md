# Work packet (wave 3): edit src/app/(authenticated)/tpo/profile/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u030-tpo-profile.md

## G2-19-030-011  [P1] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:46-56 — Name (first+last), Role from facultyType, Department, Phone, Email.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:68-113 — Display name, College, College code, Department, Membership status, Roles in this college; Phone/Email absent.
- Fix: Restore source five fields and display logic while retaining privacy controls as needed.

## G2-19-030-020  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:33-38 — direct image upload via presign folder profile-images,type image,userId.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:44-124 — no upload control/API from TPO profile.
- Fix: Use signed upload with owner authorization; secure replacement flow.

## G2-19-030-032  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:24-30 and docs/legacy-source/frontend/src/api/Services/ProfileService.js:205-209 — PUT faculty/:facultyId/header with {profileImage}; replace previous public image; delete owned R2 file best effort.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:44-124 and src/modules/placements/tpo-self-profile-service.ts:36-164 — no PATCH/PUT photo mutation.
- Fix: Add authorized avatar storage mutation with safe cleanup/ownership.

## G2-19-030-044  [P1] MISSING  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:33-37 and docs/legacy-source/frontend/src/utils/uploadToR2.js:51-73 — presigned direct image upload with API fallback.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:44-124 — no upload widget, no link import.
- Fix: Restore signed URL upload or document intentional removal.

## G2-19-030-059  [P1] MISSING  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:35 and docs/legacy-source/frontend/src/utils/uploadToR2.js:51-73 — old image pipeline R2 presigned storage + delete service.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:44-124 — no image provider integration in TPO page.
- Fix: Use first-party signed storage APIs with scoped attestation.

## G2-19-030-064  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:22-44 — legacy photo editable, phone/email read-only.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:117-123 — entire page deliberately read-only.
- Fix: Restore limited photo self-service or log explicit owner-approved discontinuation.
