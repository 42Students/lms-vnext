# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-5-001-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [x] G2-5-001-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-005-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-006-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [x] G2-5-006-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-007-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [x] G2-5-009-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-009-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-019-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-019-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)

## Results

- G2-5-001-040: OK — `src/components/attendance/admin-attendance-workspace.tsx:270-279` computes counted and present marks separately for each learner, including absent-implied counted cells via `adminAttendanceCellState`; matches `docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:99-112`.
- G2-5-001-046: OK — `src/components/attendance/admin-attendance-workspace.tsx:380-394` exports empty unscheduled dates, N for unmarked, and attended/counted for multi-session days; matches `docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:448-463`.
- G2-5-006-025: OK — `src/components/attendance/admin-attendance-workspace.tsx:208-224,413,528-534` preserves last verified results only for an identical scope, warns on refresh failure and offers Retry; matches `docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:523-538`.
- G2-5-009-040: OK — `src/modules/attendance/admin-service.ts:530-560,663-674` provides college/delivery-scoped fresh record reading and transaction-time optimistic comparison; `src/components/attendance/admin-attendance-workspace.tsx:309-357` reads before writing and submits the token; matches `docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:52-71` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:206-259`.
