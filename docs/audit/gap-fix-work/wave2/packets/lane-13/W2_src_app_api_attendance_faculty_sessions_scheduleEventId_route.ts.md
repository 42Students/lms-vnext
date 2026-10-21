# Work packet (wave 2): edit src/app/api/attendance/faculty/sessions/[scheduleEventId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/attendance-bulk-controller.md

## G2-2-027-001  [P2] GAP  facet F01  effort M
- Legacy: AttendanceBulkController.java:43-49 mounts POST /api/v1/attendance/bulk.
- vNext now: src/app/api/attendance/faculty/sessions/[scheduleEventId]/route.ts:13-33 exposes PATCH on a session UUID.
- Fix: Migrate callers and support documented endpoint/HTTP method parity; keep same-origin guard.
