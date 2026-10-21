# Work packet (wave 2): edit src/modules/activity/learner-notification-history-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/notification-service.md

## G2-18-012-011  [P2] GAP  facet F05  effort M
- Legacy: Legacy recipient feed page0 default100, clamp max500, page number (`NotificationServiceImpl.java:271-304`).
- vNext now: New learner history keyset cursor, 40 rows (`learner-notification-history-service.ts:12-27`).
- Fix: Retain equivalent load-more and total/older-message semantics in new cursor model.

## G2-18-012-050  [P2] GAP  facet F19  effort M
- Legacy: Legacy class DTO list default100/max500, other admin list max200 (`NotificationServiceImpl.java:175-191,271-304`).
- vNext now: New own history keyset40 (`learner-notification-history-service.ts:12-27`).
- Fix: Document visible-page cap differences and paginate without truncating user history.
