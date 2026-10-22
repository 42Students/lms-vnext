# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-5-027-082  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-032-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [x] G2-6-001-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-6-001-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-6-015-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [x] G2-6-019-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-15-001-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-15-004-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-15-006-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [x] G2-15-009-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)

## Results
- G2-15-004-069: OK — `src/modules/projects/member-service.ts` (`listMyLearnerProjectPage`) applies persisted learner membership, college, role and active account scoping to count and SQL paged rows, with deterministic sort, `limit(pageSize)` and `offset((page-1)*pageSize)`; `src/app/(authenticated)/learn/projects/page.tsx` validates page/filter inputs and provides the page controls, and `src/app/(authenticated)/learn/projects/error.tsx:1-21` provides a visible recoverable Retry boundary. Legacy `docs/legacy-source/frontend/src/components/Projects/ProjectsContent.jsx:195-255` paged project loading, failure recovery and refresh UI.
- G2-5-027-082: OK — `src/modules/attendance/learner-service.ts:164-242,250-279` reads the learner's authorized schedule sessions, persisted attendance status and `markedAt`; `src/modules/attendance/model.ts:33-48` interprets absent exceptions explicitly and a missing exception in a MARKED session as PRESENT, equivalent to soft-deleting a legacy absence. Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:801-845,851-892` marks an absence and soft-deletes it to mark present, retaining taken-session semantics. This is read/status parity, not a claim that historical soft-delete audit rows were migrated.
- G2-15-009-047: OK — `src/components/attendance/faculty-attendance-workspace.tsx:566-589` posts scoped `deliveryId`, title, and validated UTC `startsAt`/`endsAt` to the faculty attendance API; `src/modules/attendance/faculty-schedule-editor-model.ts:1-34` converts IST local input to offset-safe instants. Old POST contract in `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:69-74` used `/api/v1/faculty/schedules`; vNext intentionally resolves legacy faculty/class/course identifiers server-side through an authorized delivery rather than trusting caller-supplied IDs (`src/modules/attendance/faculty-schedule-mutation-service.ts:86-87`).
- G2-6-019-051: FIXED — `f7340943e8c031ecaa7829725476f0f5f80bdc0b`, `src/components/profile/learner-profile-workspace.tsx` now exposes persisted `papInterest` in both display and edit controls; `src/modules/people/profile-validation.ts:592-599` retains both `examSlotPreference` and `papInterest`. Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:34-39`.
- G2-6-001-047: OK — `src/modules/people/faculty-bulk-import-model.ts:11,28,76-91` accepts and validates the Faculty Type CSV field as only LECTURER or MENTOR; `src/modules/people/faculty-bulk-import-service.ts:75-82` preserves the lecturer/mentor distinction during import. Matches `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:600,666-668,718`.

