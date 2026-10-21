# Work packet (wave 2): edit src/modules/messaging/tpo-campaign-draft-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/tpo-email-campaign-controller.md

## G2-20-022-008  [P2] GAP  facet F06  effort M
- Legacy: Subject max200 body max10000 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:51-55`
- vNext now: New subject2..200 body2..10000 plus title/segment/template `src/modules/messaging/tpo-campaign-draft-model.ts:3-12`
- Fix: Map every form field and length
