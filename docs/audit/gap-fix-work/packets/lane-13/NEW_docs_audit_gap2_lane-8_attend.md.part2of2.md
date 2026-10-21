# Work packet: NEW / MISSING items from docs/audit/gap2/lane-8/attend.md (part 2 of 2)

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/attend.md

## G2-8-021-030  [P2] GAP  facet F08  effort M
- Legacy: Legacy correction success response Marked present (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:337-343).
- vNext now: New returns scheduleEventId/membershipId/status receipt (src/modules/attendance/admin-service.ts:639-645).
- Fix: Show exact Marked present confirmation for PRESENT correction.

## G2-8-021-031  [P2] GAP  facet F08  effort M
- Legacy: Legacy bulk success tells how many learners; partial success includes failed count (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:169-177).
- vNext now: New faculty all-or-nothing transaction returns markedAbsent/markedPresent/markedAt (src/modules/attendance/faculty-service.ts:701-708).
- Fix: Make success count wording consistent, explain no partial success and clearly expose retry.
