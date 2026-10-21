# Work packet: edit src/modules/messaging/tpo-campaign-dispatch-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u012-zeptomail-service.md, docs/audit/gap2/lane-19/tpo-email-campaign-service.md, docs/audit/gap2/lane-20/tpo-email-campaign-controller.md, docs/audit/gap2/lane-4/cross-notifications.md

## G2-14-012-057  [P1] GAP  facet F21  effort L
- Legacy: Legacy NotificationDispatcherService event registry triggers Zepto templates `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155`
- vNext now: New outbound provider requires explicit template map; campaign dispatch separately gated `src/modules/messaging/providers.ts:23-46` `src/modules/messaging/tpo-campaign-dispatch-service.ts:25-50`
- Fix: Create legacy event-to-template registry parity matrix

## G2-19-010-034  [P1] GAP  facet F10  effort L
- Legacy: Legacy POST `/api/v1/tpo/campaigns` stores header then sends within @Transactional service `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoEmailCampaignController.java:37-42` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:50-65`
- vNext now: vNext separate create draft then CAS `DRAFT→SENDING→SENT` `src/modules/messaging/tpo-campaign-draft-service.ts:33-86` `src/modules/messaging/tpo-campaign-dispatch-service.ts:65-81` `src/modules/messaging/tpo-campaign-dispatch-service.ts:234-239`
- Fix: Map historical sent campaigns to final status without replaying external messages.

## G2-19-010-037  [P1] GAP  facet F10  effort L
- Legacy: Legacy writes recipient rows SENT/FAILED/NO_EMAIL/NOT_CONFIGURED/UNSUBSCRIBED/NOT_FOUND `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:68-110`
- vNext now: vNext recipient states PENDING/QUEUED/SENT/FAILED/SKIPPED_* plus batch receipts `src/modules/messaging/tpo-campaign-dispatch-service.ts:112-122` `src/modules/messaging/tpo-campaign-dispatch-service.ts:205-239`
- Fix: Create a status translation table and preserve historical skipped reason visibility.

## G2-19-010-061  [P1] GAP  facet F19  effort L
- Legacy: Legacy loops recipients within one synchronous transactional request max500 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:50-67` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:93-113`
- vNext now: vNext dispatch loops max500 and does external sends with CAS statuses; no background worker visible `src/modules/messaging/tpo-campaign-dispatch-service.ts:82-102` `src/modules/messaging/tpo-campaign-dispatch-service.ts:158-203`
- Fix: Measure request timeout for 500 recipients; queue/resume with at-most-once guarantee if needed.

## G2-20-022-011  [P1] GAP  facet F07  effort M
- Legacy: Missing template makes emailAvailable false `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:39-41`
- vNext now: Dispatch requires VERIFIED env and dedicated template `src/modules/messaging/tpo-campaign-dispatch-service.ts:25-44`
- Fix: Visible preflight before send

## G2-4-032-052  [P1] MISSING  facet F15  effort M
- Legacy: Single TRAI job-update template using name (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:156-169`)
- vNext now: Email campaign provider only; no learner TRAI/SMS bridge (`src/modules/messaging/tpo-campaign-dispatch-service.ts:98-111`)
- Fix: Connect Exotel DLT template for legacy job update events.
