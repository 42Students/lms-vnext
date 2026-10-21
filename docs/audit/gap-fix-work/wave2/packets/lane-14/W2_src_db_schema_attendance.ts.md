# Work packet (wave 2): edit src/db/schema/attendance.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u020-class-schedule.md, docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-2/attendance-bulk-controller.md

## G2-18-020-007  [P2] GAP  facet F03  effort M
- Legacy: ClassSchedule.java:34-35 attendance_marked_at distinguishes untouched session from all-present
- vNext now: src/db/schema/attendance.ts:63-106 UNMARKED/MARKED with markedAt and actor
- Fix: Keep explicit Marked/Not marked/All present indicators and display verified mark timestamp

## G2-18-009-098  [P2] GAP  facet F22  effort M
- Legacy: Legacy learner threshold via response attendanceThresholdPercent or fallback 75 (`StudentAttendanceView.jsx:85-92`; `attendanceConstants.js:5-10`).
- vNext now: New attendance_policies per College threshold 1..100, fallback75, window24h (`attendance.ts:17-60`; `learner-service.ts:39-43,101-115`).
- Fix: Migrate college threshold overrides and validate exposure per tenant.

## G2-2-027-015  [P2] GAP  facet F04  effort M
- Legacy: Attend.java:16-26 stores studentId string, scheduleId integer, free-text dropClassReason.
- vNext now: src/db/schema/attendance.ts:103-133 stores UUID membership, event, typed status, note max1000.
- Fix: Map legacy absence reason to note with length policy, retain historical reason content.

## G2-2-027-090  [P2] GAP  facet F22  effort L
- Legacy: Attend.java:11-26 unique(student_id,class_schedule_id), `drop_class_reason` and nullable status.
- vNext now: src/db/schema/attendance.ts:103-162 unique(event,membership), typed ABSENT/PRESENT/EXCUSED/MEDICAL/LATE, note1000.
- Fix: Define legacy row migration and preserve status/reason mapping; do not duplicate explicit present rows.

## G2-2-027-091  [P2] GAP  facet F22  effort M
- Legacy: ClassSchedule.java:32-35 nullable attendance_marked_at in class_schedule row.
- vNext now: src/db/schema/attendance.ts:52-89 separate attendance_sessions with status/mark timestamp.
- Fix: Backfill MARKED sessions exactly from old timestamp, preserve all-present sessions.
