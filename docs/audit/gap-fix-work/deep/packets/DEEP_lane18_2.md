# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-13-018-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-018-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-17-23-077  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-18-019-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-18-026-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-19-029-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-14-014-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_7.md)
- [ ] G2-2-010-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-16/W1_lane16_3.md)
- [ ] G2-18-023-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-8-002-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)

## Results
- G2-14-014-061: OK — `src/db/schema/db10-announcements.ts:55-68,77-89,98-125` preserves original sender type and ID, source timestamps, deletion tombstone and scheduling/expiry/pin data, matching `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:36-68`.
- G2-8-002-021: OK — `src/app/(authenticated)/admin/people/directory/page.tsx:24-27,51-77` redirects non-Super-Admins and requires a selected college; `src/modules/people/admin-user-directory-service.ts` applies the selected-college boundary, matching staff-only and denied-directory rules from `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:441-447`.
- G2-13-018-031: FIXED — `76cd89b71a3c03c6248f20c236d1aced27ddb4a8` `src/modules/academics/program-service.ts` now selects authorized organization-scoped read-only programs, and `9b89feff64fdecde8f733bb06b7495491e062807` `src/app/(authenticated)/admin/programs/page.tsx` exposes the selection; aligns with `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:89-115`.
- G2-13-018-055: FIXED — `76cd89b71a3c03c6248f20c236d1aced27ddb4a8` `src/modules/academics/program-service.ts` restores organization-filtered reads while retaining the existing department and college read boundaries; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:15-50`.
- G2-2-010-030: OK — `src/modules/attendance/policy-service.ts:237-274` resets a college override by deleting its persisted row, restoring inherited defaults instead of freezing a new explicit value; matches `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:106-118`.
- G2-19-029-022: OK — `src/modules/colleges/legacy-domain-login-readiness.ts:45-55` emits `EMPTY_COLLEGE_NO_ACADEMIC_DATA` as a nonblocking warning and calculates login readiness from domain blockers only, matching `docs/legacy-source/frontend/src/components/superadmin/SEC/ReadinessGate.js:66-71`.
- G2-18-019-006: FIXED — `ebd511052d10e2bddc0f2f029fa5ee9edceac51b`, `docs/audit/gap-fix/legacy-identity-crosswalk-lane-14.md`, explicitly maps legacy integer faculty identity into verified, college-scoped canonical user and faculty membership UUIDs without treating OTP challenges as authentication grants.
- G2-18-026-026: OK — `src/modules/academics/college-program-mutation-service.ts:61-109` resolves the acting college for each mutation and locks the linked active college/department; `src/modules/permissions/acting-college.ts:11-32` and `src/modules/permissions/acting-college-policy.ts:16-41` reject absent/wrong selected college or organization with `AuthorizationError`, matching `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:67-77,152-162,192-202`.
- G2-18-023-070: OK — `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:30-35,69-102` reads authorized application round/slot schedules and joins the separately loaded calendar feeds; `src/modules/placements/learner-calendar-extras-service.ts:21-72` loads visible TALK rounds and the learner's own college blocked dates, and `src/modules/placements/learner-career-calendar-model.ts:130-169` folds these into calendar events. Matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/StudentCalendarService.java:46-94`.
- G2-17-23-077: FIXED — `6a64cd9fb837dbc9472def5dc07c175b479e5c32`, `252ae99e6abfab030b908a3fcf551d3cba5e29eb`, `src/modules/placements/offer-service.ts` batch-update and history insert after stable UUID-ordered sibling locks, with serializable response transaction and conflict rollback; `0819a8f584d5caa12c1f7d8b0bd750c6d3a2fb76`, `tests/unit/chat18-offer-cascade-workload-guard.test.ts` adds structural regression checks. No runtime benchmark has been executed; the deterministic write-count regression replaces the former per-offer N+1 writes.
