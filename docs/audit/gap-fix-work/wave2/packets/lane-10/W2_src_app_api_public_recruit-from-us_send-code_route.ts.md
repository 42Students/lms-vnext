# Work packet (wave 2): edit src/app/api/public/recruit-from-us/send-code/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-4-026-002  [P2] GAP  facet F01  effort S
- Legacy: POST `/send-code` and POST `/recruit` under old base (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:58-71`)
- vNext now: POST `/api/public/recruit-from-us/send-code`; recruiter POST separate (`src/app/api/public/recruit-from-us/send-code/route.ts:7-21`)
- Fix: Map both legacy endpoints to new same-origin handlers without redirects for API consumers.
