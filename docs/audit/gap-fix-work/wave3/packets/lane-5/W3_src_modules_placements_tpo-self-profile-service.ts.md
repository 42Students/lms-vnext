# Work packet (wave 3): edit src/modules/placements/tpo-self-profile-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u030-tpo-profile.md

## G2-19-030-032  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:24-30 and docs/legacy-source/frontend/src/api/Services/ProfileService.js:205-209 — PUT faculty/:facultyId/header with {profileImage}; replace previous public image; delete owned R2 file best effort.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:44-124 and src/modules/placements/tpo-self-profile-service.ts:36-164 — no PATCH/PUT photo mutation.
- Fix: Add authorized avatar storage mutation with safe cleanup/ownership.
