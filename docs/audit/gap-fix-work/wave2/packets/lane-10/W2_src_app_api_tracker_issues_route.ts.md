# Work packet (wave 2): edit src/app/api/tracker/issues/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l18-u025-public-tracker-logs-access.md

## G2-18-025-019  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:64-101 — POST JSON {password}; AuthResponse includes tokens
- vNext now: src/app/api/tracker/issues/route.ts:12-26 — private issue GET with readiness gate
- Fix: Document removal of incompatible shared-auth API
