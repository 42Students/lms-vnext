# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-5-027-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [x] G2-5-027-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [x] G2-5-027-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-075  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-080  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)

## Results

- OK G2-5-027-025 — src/modules/people/college-student-registration-service.ts:43-72 verifies same-college active program, cohort and section before identity creation. Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-391.

- FIXED G2-5-027-029 — commits 52aca3e, 49a0b13; `src/modules/academics/errors.ts` preserves typed error codes with explicit user-facing messages, and `src/modules/people/college-student-registration-service.ts` validates section membership before identity creation and returns `Learner class must belong to the selected program`, matching `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:347-356`.

- OK G2-5-027-045 — `src/modules/attendance/faculty-service.ts:558-740` writes ABSENT exception records, marks the session MARKED, and persists COURSES_ATTENDANCE_MARKED activity inside the same transaction, matching `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:801-896` (Attend write, schedule attendanceTaken, audit).
