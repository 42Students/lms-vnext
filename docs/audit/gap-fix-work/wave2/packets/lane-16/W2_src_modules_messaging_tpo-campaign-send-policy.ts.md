# Work packet (wave 2): edit src/modules/messaging/tpo-campaign-send-policy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/tpo-email-campaign-controller.md

## G2-20-022-017  [P2] GAP  facet F12  effort S
- Legacy: Legacy selected500 even if unsubscribed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:56-59`
- vNext now: New cap counts only eligible addresses `src/modules/messaging/tpo-campaign-send-policy.ts:30-49`
- Fix: Align preflight counts and labels
