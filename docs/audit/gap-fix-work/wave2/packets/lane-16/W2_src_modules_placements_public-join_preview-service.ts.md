# Work packet (wave 2): edit src/modules/placements/public-join/preview-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/public-college-join-controller.md

## G2-8-026-002  [P2] GAP  facet F01  effort M
- Legacy: Old preview GET /api/v1/public/college-join/{token} (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCollegeJoinController.java:48-51).
- vNext now: New preview is SSR getPublicJoinPreview(token, COLLEGE); no GET counterpart at old path (src/app/college-join/[token]/page.tsx:6-11; src/modules/placements/public-join/preview-service.ts:12-34).
- Fix: Redirect old caller to new public page/SSR preview API contract.
