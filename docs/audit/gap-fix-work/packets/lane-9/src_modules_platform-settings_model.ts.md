# Work packet: edit src/modules/platform-settings/model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md, docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-10-022-098  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:148-188 — SMS uses TRAI/DLT exact template variables.
- vNext now: src/modules/platform-settings/model.ts:35-67 — New Exotel OTP and intent-only outbound catalog.
- Fix: Map old template dispatch to present Exotel/outbound contracts without claiming active sender

## G2-3-012-001  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:33-59`
- vNext now: `src/modules/platform-settings/service.ts:345-391`, `src/modules/platform-settings/model.ts:70-82`
- Fix: Legacy provides super-admin GET /api/v1/admin/sms-log for delivery troubleshooting; vNext platform settings shows a static template catalog, no delivery log route. Add restricted support endpoint and corresponding admin entry.

## G2-3-012-051  [P1] MISSING  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:19-55`, `docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:20-40`
- vNext now: `src/db/schema/db10-general-notices.draft.ts:24-78`, `src/modules/platform-settings/model.ts:27-67`
- Fix: Legacy sms_delivery_log table columns id,purpose,recipient_suffix,status,provider_message_id,error_summary,college_id,created_at and search indexes; no registered equivalent vNext SMS attempt table. Create migration/schema, retain last-four only.
