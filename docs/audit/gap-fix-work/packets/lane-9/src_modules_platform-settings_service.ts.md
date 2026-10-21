# Work packet: edit src/modules/platform-settings/service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l17-u029-tenant-settings.md, docs/audit/gap2/lane-3/exotel-sms-service-impl.md, docs/audit/gap2/lane-5/l17-u029-tenant-settings.md

## G2-17-029-014  [P1] GAP  facet F04  effort L
- Legacy: legacy TenantSettings.js:192-234 progress %, chat poll 3000-600000, save 5000-600000
- vNext now: vNext legacy-setting-specs.ts:108-136 typed inventory; platform-settings/service.ts:228-242 indicates some source values not configurable
- Fix: Identify exact runtime consumers for stored overrides; mark no-effect keys clearly, do not advertise active toggle

## G2-17-029-016  [P1] GAP  facet F04  effort M
- Legacy: legacy TenantSettings.js:260-269 schedule.pastBookingGraceMinutes 0..1440
- vNext now: vNext platform-settings/service.ts:246-272 explicitly says legacy schedule grace not represented as own knob
- Fix: Document whether override is effective; expose consumer status and do not mislead operators

## G2-3-012-001  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:33-59`
- vNext now: `src/modules/platform-settings/service.ts:345-391`, `src/modules/platform-settings/model.ts:70-82`
- Fix: Legacy provides super-admin GET /api/v1/admin/sms-log for delivery troubleshooting; vNext platform settings shows a static template catalog, no delivery log route. Add restricted support endpoint and corresponding admin entry.

## G2-3-012-027  [P1] MISSING  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:22-59`
- vNext now: `src/modules/platform-settings/service.ts:345-390`
- Fix: Legacy SMS log is strictly super-admin even with masked numbers; vNext must require global support privilege, not college/TPO, before exposing cross-tenant records.

## G2-3-012-035  [P1] MISSING  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/NotificationOutboxService.java:19-31`
- vNext now: `src/modules/platform-settings/service.ts:372-390`, `src/db/schema/db10-general-notices.draft.ts:1-12`
- Fix: Legacy TPO outbox marks missing DLT templates FAILED with reason; vNext no active general outbox, thus no corresponding persisted operational failed state. Add explicit not configured status.

## G2-17-029-063  [P1] GAP  facet F23  effort M
- Legacy: Legacy values actually applied by exact scope read; no inheritance. `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:50-68`
- vNext now: vNext stored overrides require separate deployment for auth/SMS. `src/components/admin/tenant-settings-editor.tsx:112-112`, `src/modules/platform-settings/service.ts:132-151`
- Fix: Display inactive/requires-deploy flag per key.
