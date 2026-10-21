# Work packet: edit src/modules/activity/notification-action.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/notification-service-impl.md

## G2-15-011-024  [P2] GAP  facet F07  effort M
- Legacy: Assessment URL must use http or https. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:78-83`)
- vNext now: New actionHref restricted to internal path; external URLs rejected. (`src/modules/activity/notification-action.ts:1-29`)
- Fix: Add safe external assessment URL model, keep internal notification links separate.
