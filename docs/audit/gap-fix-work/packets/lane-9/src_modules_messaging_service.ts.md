# Work packet: edit src/modules/messaging/service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/zeptomail-service.md, docs/audit/gap2/lane-15/sms-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md

## G2-13-011-022  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:172-189` maps SENT / NOT_CONFIGURED / FAILED separately
- vNext now: `src/modules/messaging/providers.ts:36-60` returns one boolean from transport; `src/modules/messaging/service.ts:94-100` has QUEUED/SUPPRESSED/FAILED/SENT
- Fix: Expose typed NOT_CONFIGURED, SUPPRESSED, FAILED and provider ACCEPTED outcomes to TPO callers

## G2-13-011-045  [P1] GAP  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-171` dispatcher also sends app and TRAI SMS alongside email
- vNext now: `src/modules/messaging/service.ts:3-7`/`src/modules/messaging/providers.ts:43-86` separates EMAIL and SMS provider; notification events not 1:1
- Fix: Create event-to-channel matrix and prove every legacy notification fan-out path is mapped

## G2-15-012-067  [P1] GAP  facet F22  effort M
- Legacy: sms_delivery_log stores purpose, 4-digit suffix, status, provider SID, error, college ID. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:21-55`)
- vNext now: New delivery record keyed hashed recipient, channel/template/purpose/status/reason. (`src/modules/messaging/service.ts:8-21`)
- Fix: Define audit-schema crosswalk and support lookup without storing raw phone.

## G2-18-010-052  [P1] GAP  facet F15  effort M
- Legacy: Legacy recruiters campaign unsubscribe and sender header per college via TpoEmailCampaignService (`TpoEmailCampaignService.java:50-110`).
- vNext now: New messaging batch supports SUPPRESSED for unsubscribed, requires policyFor set (`messaging/model.ts:59-80`; `messaging/service.ts:27-35`).
- Fix: Wire suppression repository to campaign sender, verify per-college unsubscribed and send preview.

## G2-18-010-029  [P2] GAP  facet F07  effort S
- Legacy: Legacy dev blocked address is FAILED (logged) (`TpoMailService.java:178-182`).
- vNext now: New delivery policy returns SUPPRESSED reason nonprod-not-allowlisted (`messaging/model.ts:59-68`; `messaging/service.ts:67-74`).
- Fix: Map statuses to operator wording without misreporting attempted send.

## G2-18-010-030  [P3] GAP  facet F08  effort S
- Legacy: Legacy no UI success toast; service returns SENT to caller (`TpoMailService.java:172-190`).
- vNext now: New provider returns boolean and deliveredBatch records SENT with final audit summary (`messaging/providers.ts:32-61`; `messaging/service.ts:128-147`).
- Fix: Map service result to old operator-facing sent/failed wording in each TPO action.
