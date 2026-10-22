# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-5-007-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-5-009-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-5-011-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-5-026-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-027-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-027-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-027-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-5-027-060  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-031-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-5-032-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)

## Results
- G2-5-009-030: FIXED — `908238ad03d6d45dce21d48eaf99799a1a703fcd`, `src/components/attendance/admin-attendance-workspace.tsx` (failed record-detail reads now have a direct Retry record action and correction remains disabled until a verified record is available; legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:52-71,258-266`).
- G2-5-026-021: OK — `src/app/(authenticated)/admin/inbound-mail/page.tsx:21-35,94-140` provides private global Super Admin inbox with OTHER kind and FAILED routing filters, while `src/modules/inbound-mail/admin-service.ts:45-82,86-106` reads persisted events with safe previews and global authorization. Legacy separation of OTHER and failed inbound routing: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:23-32`.
- G2-5-027-060: OK — `src/modules/people/college-student-csv-model.ts:4-52` accepts structured `students` JSON (max 500) and deterministically transforms to CSV, enforced by existing Zod request schema used at `src/app/api/people/student-import/route.ts:19-21`. Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BulkRegisterRequest.java:20-34` accepts up to 500 learner objects; legacy numeric academic IDs require explicit UUID resolution.
- G2-5-011-005: OK — `src/app/(authenticated)/teacher/calendar/page.tsx:69-103` renders one Class Schedule heading, Next classes, and a single primary calendar; optional second month grid is behind a disclosure at `:104-174`. Matches `docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:357-436`.
- G2-5-007-025: FIXED — `da92924bca235694f2d863d6a801bb562b9066c3`, `src/components/admin/super-admin-interview-operations.tsx` (legacy five interview types, Online/In-person mode options; reference `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:51-56,78-87,264-272`).

- G2-5-032-009: FIXED — `113af455b6c494093a15e8e80d14d583d5714d6a`, `src/modules/operations/scheduled-job-runner.ts` (`processFencedNotificationBatch` now takes an optional durable audit writer with processed/succeeded/failed/remaining counts and sanitized failed-entry IDs, checked under current lease). Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:107-154` reports release outcome counts and failures. Deployment callers must provide the persistent writer for durable records.
