# Work packet (wave 2): edit src/modules/platform-settings/model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-3-012-003  [P2] MISSING  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:49-83`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:14-24`
- vNext now: `src/modules/platform-settings/model.ts:27-67`, `src/modules/platform-settings/service.ts:345-391`
- Fix: Legacy API has support log table data, filter and paging surface; vNext has informational SMS template inventory. Implement actual log table in one white canvas when the legacy UI route is verified.

## G2-3-012-005  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:49-82`
- vNext now: `src/modules/platform-settings/model.ts:27-67`, `src/modules/platform-settings/service.ts:345-390`
- Fix: Legacy support rows expose status, recipient suffix, purpose, provider message ID and failure reason; vNext has no corresponding table, counter or status badge. Add headers and compact status pills.

## G2-3-012-010  [P2] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:14-24`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:53-72`
- vNext now: `src/modules/platform-settings/model.ts:27-67`, `src/modules/platform-settings/service.ts:345-390`
- Fix: Legacy admin log filters by recipient suffix and purpose; defaults page0 size50, max200, sorted createdAt DESC/id DESC. No vNext SMS log query or pager. Add identical controls/defaults and filtering.

## G2-3-012-041  [P2] MISSING  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:49-83`
- vNext now: `src/modules/platform-settings/service.ts:345-391`, `src/modules/platform-settings/model.ts:27-67`
- Fix: Legacy offers filterable support-log API; vNext no log UI accessibility. Add labeled search fields, focus-preserving pagination and screen reader acceptance note.
