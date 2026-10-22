# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-17-006-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-17-010-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-17-010-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-18-009-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-18-009-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-18-009-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-19-001-087  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-002-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-002-092  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-002-094  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)

## Results

- G2-18-009-019: OK — vNext `src/components/attendance/faculty-attendance-workspace.tsx:787-848` renders every calendar day per learner, including no-class cells and unmarked/upcoming sessions; legacy `docs/legacy-source/frontend/src/components/Attendance/TeacherAttendanceView.jsx:327-419` (source packet reference).
- G2-18-009-014: OK — vNext `src/components/attendance/faculty-attendance-workspace.tsx:974-989` places status pill and Schedule Class action beside the session heading, showing explicit `Marking unavailable` under vNext's enforced window; legacy `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:279-307` places `Ready to mark` and Schedule Class in the same header. Timed access remains a documented intentional policy difference.
