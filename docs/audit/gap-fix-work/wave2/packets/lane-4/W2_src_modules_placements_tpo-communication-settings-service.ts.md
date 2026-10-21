# Work packet (wave 2): edit src/modules/placements/tpo-communication-settings-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-3-012-039  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/NotificationOutboxService.java:44-53`, `67-89`
- vNext now: `src/modules/placements/tpo-communication-settings-service.ts:18-46`, `src/modules/platform-settings/service.ts:379-390`
- Fix: Legacy outgoing optional notices respect preference flags/cap and digest timing; vNext stores settings but has no established TPO outgoing consumer. Enforce settings during dispatch.
