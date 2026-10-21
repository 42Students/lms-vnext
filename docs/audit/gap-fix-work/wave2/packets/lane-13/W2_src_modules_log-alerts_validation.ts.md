# Work packet (wave 2): edit src/modules/log-alerts/validation.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-12-024-011  [P2] GAP  facet F06  effort M
- Legacy: Mute request environment required `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:101-110`
- vNext now: Typed PATCH MUTE needs UUID, muted and optional reason `src/modules/log-alerts/validation.ts:3-15`
- Fix: Map legacy message/path lookup into signature ID.
