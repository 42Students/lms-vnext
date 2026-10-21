# Work packet: edit src/modules/messaging/tpo-campaign-draft-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/tpo-email-campaign-service.md

## G2-19-010-034  [P1] GAP  facet F10  effort L
- Legacy: Legacy POST `/api/v1/tpo/campaigns` stores header then sends within @Transactional service `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoEmailCampaignController.java:37-42` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:50-65`
- vNext now: vNext separate create draft then CAS `DRAFT→SENDING→SENT` `src/modules/messaging/tpo-campaign-draft-service.ts:33-86` `src/modules/messaging/tpo-campaign-dispatch-service.ts:65-81` `src/modules/messaging/tpo-campaign-dispatch-service.ts:234-239`
- Fix: Map historical sent campaigns to final status without replaying external messages.
