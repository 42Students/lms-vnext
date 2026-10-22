# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-5-007-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-009-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-5-011-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-026-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-027-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-027-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-027-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-027-060  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-031-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-032-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)

## Results
- G2-5-011-005: OK — `src/app/(authenticated)/teacher/calendar/page.tsx:69-103` renders one Class Schedule heading, Next classes, and a single primary calendar; optional second month grid is behind a disclosure at `:104-174`. Matches `docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:357-436`.
- G2-5-007-025: FIXED — `da92924bca235694f2d863d6a801bb562b9066c3`, `src/components/admin/super-admin-interview-operations.tsx` (legacy five interview types, Online/In-person mode options; reference `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:51-56,78-87,264-272`).

