# Work packet: edit src/db/schema/db10-general-notices.draft.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-3-012-026  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/NotificationOutboxService.java:145-165`
- vNext now: `src/db/schema/db10-general-notices.draft.ts:1-12`, `24-66`
- Fix: Legacy TPO outbox claims every 10s then dispatches APP/EMAIL/SMS, with undo holds; vNext general notification outbox draft is not barrel-exported or activated. Activate after migrations/scope tests.

## G2-3-012-035  [P1] MISSING  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/NotificationOutboxService.java:19-31`
- vNext now: `src/modules/platform-settings/service.ts:372-390`, `src/db/schema/db10-general-notices.draft.ts:1-12`
- Fix: Legacy TPO outbox marks missing DLT templates FAILED with reason; vNext no active general outbox, thus no corresponding persisted operational failed state. Add explicit not configured status.

## G2-3-012-038  [P1] MISSING  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/NotificationOutboxService.java:55-66`
- vNext now: `src/db/schema/db10-general-notices.draft.ts:1-12`, `24-64`
- Fix: Legacy outbox fans out SMS for round, offer, deadline, cancellation events plus APP; vNext general-notices DB10 remains draft, no sender. Implement when ready.

## G2-3-012-049  [P1] MISSING  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:156-171`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/NotificationOutboxService.java:145-165`
- vNext now: `src/db/schema/db10-general-notices.draft.ts:1-12`, `src/modules/messaging/providers.ts:26-91`
- Fix: Legacy has active dispatcher and TPO background due-scan; vNext general notices is draft and generic provider is not connected to source job events. Implement durable provider handoff after migration.

## G2-3-012-051  [P1] MISSING  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:19-55`, `docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:20-40`
- vNext now: `src/db/schema/db10-general-notices.draft.ts:24-78`, `src/modules/platform-settings/model.ts:27-67`
- Fix: Legacy sms_delivery_log table columns id,purpose,recipient_suffix,status,provider_message_id,error_summary,college_id,created_at and search indexes; no registered equivalent vNext SMS attempt table. Create migration/schema, retain last-four only.

## G2-3-012-052  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/NotificationOutboxService.java:91-118`, `145-165`
- vNext now: `src/db/schema/db10-general-notices.draft.ts:1-12`, `24-114`
- Fix: Legacy active notification_outbox stores sendAfter/status/undoGroup and worker claims due; vNext general_notification_outbox draft models shape but is not migrated/activated. Complete safe activation workflow.
