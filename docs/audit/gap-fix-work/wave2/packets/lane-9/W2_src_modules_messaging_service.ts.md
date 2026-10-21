# Work packet (wave 2): edit src/modules/messaging/service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/sms-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md

## G2-15-012-015  [P2] GAP  facet F05  effort M
- Legacy: Delivery log stores purpose/recipient suffix/status/message id and createdAt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:25-55`)
- vNext now: New DeliveryRecord has recipientKey/templateKey/purpose/status/reason. (`src/modules/messaging/service.ts:8-22`)
- Fix: Surface equivalent support audit search by recipient suffix/purpose safely.

## G2-15-012-016  [P2] GAP  facet F05  effort M
- Legacy: Old support query newest-first by createdAt and id, suffix/purpose filters. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:14-24`)
- vNext now: New service repository abstract, no matching suffix search in interface. (`src/modules/messaging/service.ts:8-22`)
- Fix: Create privileged support filter for time, purpose and redacted recipient handle.

## G2-15-012-069  [P2] GAP  facet F22  effort M
- Legacy: DB lookup by suffix and purpose newest first. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`)
- vNext now: Generic interface auditBatch lacks suffix search contract. (`src/modules/messaging/service.ts:18-22`)
- Fix: Implement indexed redacted audit search matching legacy support workflow.

## G2-18-010-037  [P2] GAP  facet F10  effort M
- Legacy: Legacy platform Zepto sends one email per call, `sendAsCollege` injects workspace link (`TpoMailService.java:73-97`).
- vNext now: New outbound generic batch requires policy/repository/recipientKey and controlled async send (`messaging/service.ts:27-51,67-146`).
- Fix: Preserve per-recipient transactional result and shared tenant context in adapter.

## G2-18-010-069  [P2] GAP  facet F22  effort M
- Legacy: Legacy no email attempts persistence inside facade; upstream campaigns track statuses and recipient rows (`TpoMailService.java:172-190`; `TpoEmailCampaignService.java:62-113`).
- vNext now: New deliveryBatch persists opaque recipient keyed DeliveryRecord and summaries (`messaging/service.ts:8-22,94-147`).
- Fix: Define campaign-recipient/notification-event migration and dashboard status rollup.
