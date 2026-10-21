# Work packet (wave 2): edit src/modules/attendance/parent-sms-provider.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-3-012-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:20-35`
- vNext now: `src/modules/notifications/exotel-sms.ts:124-129`, `src/modules/attendance/parent-sms-provider.ts:34-38`
- Fix: Legacy status SENT means provider accepted, not delivered; vNext OTP uses accepted log and attendance ACCEPTED result, no consistent support badge. Expose `Provider accepted` instead of claiming handset delivery.

## G2-3-012-015  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:155-162`
- vNext now: `src/modules/notifications/exotel-sms.ts:65-74`, `src/modules/messaging/providers.ts:62-66`, `src/modules/attendance/parent-sms-provider.ts:16-20`
- Fix: Legacy global message body max2000 chars; vNext generic max1600, attendance max1000, OTP fixed. Reconcile per-template max with approved DLT content, document intentional limits.
