# Work packet (wave 2): edit src/modules/placements/public-unsubscribe-preview-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md

## G2-10-026-011  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:126-129 — Blank/over200 token ignored, no error.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:22-25; src/modules/placements/public-unsubscribe-preview-service.ts:8-20 — Bound2048 and signed-token validity.
- Fix: Specify grandfathering policy for old tokens.
