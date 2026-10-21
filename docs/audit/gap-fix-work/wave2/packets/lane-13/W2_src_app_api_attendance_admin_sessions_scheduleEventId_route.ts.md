# Work packet (wave 2): edit src/app/api/attendance/admin/sessions/[scheduleEventId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/attend.md

## G2-8-021-003  [P2] GAP  facet F01  effort M
- Legacy: Admin reads individual cells through GET /api/v1/admin/attendance/record (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:206-212).
- vNext now: New admin flow uses /college/attendance plus session PATCH, not the old record URL (src/app/(authenticated)/college/attendance/page.tsx:26-40; src/app/api/attendance/admin/sessions/[scheduleEventId]/route.ts:13-36).
- Fix: Map legacy record-link consumers to new college grid and session/cell detail.
