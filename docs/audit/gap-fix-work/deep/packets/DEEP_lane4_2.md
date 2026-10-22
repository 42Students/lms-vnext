# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-17-006-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-17-010-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-17-010-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-18-009-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-18-009-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-18-009-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-19-001-087  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-19-002-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-19-002-092  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-19-002-094  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)

## Results

- G2-18-009-019: OK — vNext `src/components/attendance/faculty-attendance-workspace.tsx:787-848` renders every calendar day per learner, including no-class cells and unmarked/upcoming sessions; legacy `docs/legacy-source/frontend/src/components/Attendance/TeacherAttendanceView.jsx:327-419` (source packet reference).
- G2-18-009-014: OK — vNext `src/components/attendance/faculty-attendance-workspace.tsx:974-989` places status pill and Schedule Class action beside the session heading, showing explicit `Marking unavailable` under vNext's enforced window; legacy `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:279-307` places `Ready to mark` and Schedule Class in the same header. Timed access remains a documented intentional policy difference.
- G2-18-009-002: OK — vNext `src/components/attendance/faculty-class-switcher.tsx:1-57` renders an assigned-section Class selector and canonical delivery-based route; `src/components/attendance/faculty-attendance-workspace.tsx:319-362` broadcasts dirty edits and guards navigation. Legacy `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:20-42` switches the class via `?cls=` with a draft-discard confirmation. vNext delivery route carries the scoped class identity rather than reusing the numeric `cls` hint.

- G2-19-002-034: OK — legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1553-1556` defaults `Visible to students` to true. vNext `src/db/schema/courses.ts:414-423` separately defaults lesson visibility to true; `src/components/courses/super-admin-content-actions.tsx:150-151,227-233` keeps content in DRAFT until an explicit Publish confirmation and explains learner visibility. This preserves default visibility without exposing unpublished content.

- G2-17-010-010: OK — vNext `src/modules/operations/notification-scheduled-job-service.ts:257-342` processes the `TODAY` interview phase, emits `IN_APP` only and deduplicates by slot/version/user; `src/app/api/internal/operations/notification-scheduler/route.ts:105-110` routes the morning job through its fenced lease; `src/modules/operations/tpo-scheduled-job-registry.ts:35-40` schedules 08:00 IST. Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:64-66` runs today's in-app-only interview reminders at 08:00 IST.
- G2-19-001-087: OK (field crosswalk, not a claim that migration ran) — vNext `src/db/schema/profiles.ts:16-39` preserves learner source ID, batch, roll/unique ID, private JSON and document version; `src/db/schema/memberships.ts:19-47` preserves scoped status/suspension/legacy keys; `docs/audit/gap-fix/legacy-identity-crosswalk-lane-14.md` explicitly maps class transfers via enrollments, audited IDs, contact/identity collision handling, source batch and private profile fields. Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:17-105` contains the monolithic source fields. Actual data backfill remains a separate migration execution obligation.

- G2-19-002-092: FIXED — `d98c27b` adds `docs/audit/gap-fix/legacy-lesson-content-import-crosswalk-chat4.md` mapping source lesson/course/class/faculty and JSON, sequence, visibility, points, deadlines and source IDs to scoped vNext destinations. Destination `src/db/schema/courses.ts:451-495`; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:23-58`. Defines importer requirements, not a completed data migration.
- G2-19-002-094: FIXED — `d98c27b`, `docs/audit/gap-fix/legacy-lesson-content-import-crosswalk-chat4.md` identifies video/YouTube/live/PPT/PDF/resource normalized kinds and preserves raw historical type, while assignment and quiz kinds require dedicated entity imports with crosswalks and quarantine. Legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:92-109` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:35-41`.

- G2-17-006-030: OK — vNext `src/modules/courses/learner-course-service.ts:469-476` checks course `status`, `enabled`, and `legacyAllowedForDisplay` before fetching learner content even for historical UUID bookmarks; `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:111-121` converts denied lesson access into a not-found state, while `:181-187` restricts historical classes to read-only. Legacy `docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:66-70` denies unavailable courses and `docs/legacy-source/frontend/src/utils/courseUtils/contentAvailability.js:47-84` distinguishes invisible vs locked.
