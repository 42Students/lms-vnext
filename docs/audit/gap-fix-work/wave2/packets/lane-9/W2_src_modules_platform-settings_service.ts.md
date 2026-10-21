# Work packet (wave 2): edit src/modules/platform-settings/service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
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

## G2-3-012-022  [P2] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:49-83`
- vNext now: `src/modules/platform-settings/service.ts:345-391`
- Fix: Legacy support log endpoint supports forbidden, server-error and page/data note response. vNext inventory has no corresponding list pending/error/retry/permission states. Add UI/error messages.

## G2-3-012-039  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/NotificationOutboxService.java:44-53`, `67-89`
- vNext now: `src/modules/placements/tpo-communication-settings-service.ts:18-46`, `src/modules/platform-settings/service.ts:379-390`
- Fix: Legacy outgoing optional notices respect preference flags/cap and digest timing; vNext stores settings but has no established TPO outgoing consumer. Enforce settings during dispatch.

## G2-3-012-041  [P2] MISSING  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:49-83`
- vNext now: `src/modules/platform-settings/service.ts:345-391`, `src/modules/platform-settings/model.ts:27-67`
- Fix: Legacy offers filterable support-log API; vNext no log UI accessibility. Add labeled search fields, focus-preserving pagination and screen reader acceptance note.

## G2-3-012-042  [P2] MISSING  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:80-83`
- vNext now: `src/modules/platform-settings/service.ts:372-390`
- Fix: Legacy response note literal `SENT means the operator accepted the message. Handset delivery is not reported by the provider.`; vNext no per-log note. Show same text.
