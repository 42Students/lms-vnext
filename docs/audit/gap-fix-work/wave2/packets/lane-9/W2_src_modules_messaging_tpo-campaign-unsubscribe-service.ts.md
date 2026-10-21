# Work packet (wave 2): edit src/modules/messaging/tpo-campaign-unsubscribe-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u014-email-suppression-repository.md, docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md, docs/audit/gap2/lane-19/tpo-email-campaign-service.md, docs/audit/gap2/lane-20/tpo-email-campaign-controller.md

## G2-18-014-027  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:346-354 — invitation unsubscribe TPO bell and activity.
- vNext now: src/modules/messaging/tpo-campaign-unsubscribe-service.ts:47-95 — campaign unsubscribe records activity and in-app TPO notification.
- Fix: Compare per-invitation vs per-campaign notification copy and recipients.

## G2-10-026-046  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:130-135 — TPO bell event on first unsubscribe.
- vNext now: src/modules/messaging/tpo-campaign-unsubscribe-service.ts:65-86 — InAppNotifications to active TPO memberships.
- Fix: Verify recipient set and wording.

## G2-10-026-066  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:123-135 — Suppresses future invites/campaigns on lead.
- vNext now: src/modules/messaging/tpo-campaign-unsubscribe-service.ts:49-55 — Lead/recipient suppression plus notification.
- Fix: Verify all outbound send paths check suppression.

## G2-19-010-003  [P2] GAP  facet F01  effort L
- Legacy: Legacy unsubscribe `/campaign-unsubscribe/{token}` public page and POST `/api/v1/public/campaign-unsubscribe/{token}` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:14-26` `docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:6-26`
- vNext now: vNext public confirm POST at `/api/public/campaign-unsubscribe`, signed recipient token verified `src/modules/messaging/tpo-campaign-unsubscribe-service.ts:18-25`
- Fix: Retain old link compatibility for existing sent campaigns with securely mapped tokens.

## G2-19-010-063  [P2] GAP  facet F20  effort M
- Legacy: Legacy unsubscribe unknown token is no-op and always `UNSUBSCRIBED` success `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:125-129` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:23-26`
- vNext now: vNext invalid signed token throws CampaignUnsubscribeInvalid and gives invalid-link error `src/modules/messaging/tpo-campaign-unsubscribe-service.ts:23-25` `src/modules/messaging/tpo-campaign-unsubscribe-service.ts:90-93`
- Fix: Owner decide privacy vs clarity; avoid account enumeration and reflect safe invalid link.

## G2-20-022-028  [P2] GAP  facet F20  effort S
- Legacy: Unsub POST same response for unknown token `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCampaignUnsubscribeController.java:23-27`
- vNext now: New validates claim and rejects unknown `src/modules/messaging/tpo-campaign-unsubscribe-service.ts:23-38,90-93`
- Fix: Decide safe repeat-link wording
