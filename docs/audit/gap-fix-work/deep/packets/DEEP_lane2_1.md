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
- [x] G2-5-027-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-5-027-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-5-027-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
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

- G2-5-027-012: OK — `src/components/college/college-student-csv-import.tsx:112-120,240-257` explicitly warns that bulk import creates real identities, requires a confirmation checkbox, shows row counts, and directs recovery to history rather than offering destructive Undo. `src/app/(authenticated)/admin/students/page.tsx:95-100` displays history and individual correction/suspension. The **current legacy implementation**, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java` (`undoBulkImport`), explicitly throws “Bulk import undo is disabled to protect learner work”; the obsolete controller mapping at `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:449-465` does not make undo functional.
- G2-5-027-040: OK — `src/components/college/college-student-csv-import.tsx:112-120,256-257` and `src/app/(authenticated)/admin/students/page.tsx:95-100` show import history, clearly prevent unsupported destructive undo, and provide manual account recovery. The legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java` `undoBulkImport` rejects all batch deletes to avoid orphaned assignments/attendance/projects. Adding an “Undo” modal that falsely promises removed identities would regress current legacy behavior; no destructive mutation is introduced.

- G2-5-027-002: OK — `src/app/api/college/students/register/route.ts:8-20` implements single student registration; `src/app/api/people/student-import/route.ts:10-35,39-60` covers bulk preflight, registration, persisted history and explicit safe non-destructive undo rejection; `src/modules/people/college-student-csv-service.ts:39-304` implements authorized bulk writes, durable per-batch receipts and history. Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-469` exposes five operations, but actual `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java` (`undoBulkImport`) disables unsafe batch reversal to protect learner work. vNext intentionally does not promise destructive undo.
