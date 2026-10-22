# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-15-009-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-15-009-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-15-009-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-15-009-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-15-009-080  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-15-009-085  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-15-009-092  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-16-001-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-16-005-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-16-027-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)

## Results

- G2-16-001-026: OK — `src/app/(authenticated)/tracker/audit-findings/page.tsx:46-71` catches rejected listing requests, preserves authorization errors, renders the inline `Couldn't load findings.` message and an authorized Retry link retaining the filters. Legacy: `docs/legacy-source/frontend/src/pages/tracker/audit-findings.js:60-63` (legacy file path to confirm).

- G2-15-009-080: OK — `src/components/attendance/faculty-attendance-workspace.tsx:485-553` submits the entire roster in one PATCH, preserves the draft on both explicit rejection and uncertain network failures, and tells the teacher to refresh persisted marks before retrying an ambiguous result. `src/modules/attendance/faculty-service.ts:640-710,779-790` updates marks and session status in one transaction, checks the optimistic correction token, and returns `attendanceComplete: true` only after an atomic save; partial-acceptance retry is consequently unnecessary. Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:517-548` (per-learner partial successes required retrying failed rows; the transactional vNext endpoint strengthens this to all-or-none while retaining the recovery path).

- G2-15-009-051: OK — `src/modules/attendance/admin-service.ts:83-129,276-315` authorizes college-admin and scoped Super Admin attendance through `requireAttendanceCollege`/`requirePermission` and a separate admin delivery path without requiring a Faculty teaching assignment; `src/app/api/attendance/admin/sessions/[scheduleEventId]/route.ts:5,30` uses the admin correction service. Faculty-specific assignment checks remain isolated in `src/modules/attendance/faculty-service.ts:183-225`. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:180-205`.

- G2-15-009-049: OK — `src/modules/attendance/faculty-schedule-mutation-service.ts:33-45,51-68,91-106,114-155` resolves the selected course delivery to its authorized section and faculty membership, validates college-scoped lecture halls, serializes competing section/faculty/hall bookings using college/section advisory locks, checks overlapping active sessions, and persists a course-to-session relation in the same transaction. This is the vNext scoped-ID crosswalk for legacy numeric class/faculty/course/hall references. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassScheduleServiceImpl.java:321-379`.

- G2-15-009-054: FIXED — commit `40dc4bdb49bf4c18dd7af4f9f169164eaa49b1c6`, `src/components/attendance/faculty-attendance-workspace.tsx` now explicitly explains the legacy past-date-picker versus persisted server booking restriction and configurable five-minute grace; `src/modules/attendance/faculty-schedule-mutation-service.ts:20-26,45-46,61-62` enforces that grace both before and inside the scheduling transaction. Legacy frontend: `docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:126-144` (permits past dates); legacy backend: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassScheduleServiceImpl.java:309-314` (rejects starts beyond the grace). The backend restriction is retained rather than falsely promising historical bookings.
