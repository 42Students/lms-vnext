# Work packet (wave 2): edit src/modules/messaging/tpo-campaign-recipient-token.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md

## G2-10-026-071  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:148-151 — 24 random bytes base64url token.
- vNext now: src/modules/messaging/tpo-campaign-recipient-token.ts:13-35 — Versioned college/campaign/recipient HMAC.
- Fix: Maintain old-link compatibility.
