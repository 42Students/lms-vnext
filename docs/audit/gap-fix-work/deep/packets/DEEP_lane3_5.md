# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-18-006-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-18-006-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-18-006-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-18-006-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-001-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-003-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-018-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-018-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-018-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-018-041  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)

## Results

- G2-18-006-046: OK — vNext src/components/academics/learner-class-schedule.tsx:359,598-601 (useTransition navigation shows a role=status "Loading the selected schedule period…" indicator while the next window loads; :424 hides previous-month events so they never appear under the wrong period) matches docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:256-262 (spinner on refetch).
- G2-18-006-059: OK — vNext src/modules/academics/learner-calendar-window-model.ts:1-18 (learnerCalendarVisibleWindow = exactly the visible 42-day IST grid) fetched per month via src/app/(authenticated)/learn/calendar/page.tsx:45 and navigateCalendarWindow (learner-class-schedule.tsx:452-464, router.replace in a transition so the newest navigation supersedes the previous one) matches CalendarEvents.js:69-103,152-173.
- G2-18-006-061: FIXED — latest-wins race: navigating back to the already loaded month while another month was still loading returned early and the stale pending month then replaced the user's choice; navigateCalendarWindow now issues the superseding navigation when a transition is pending (src/components/academics/learner-class-schedule.tsx:454-457). Matches CalendarEvents.js fetchSeq/AbortController latest-wins.
- G2-18-006-069: OK — vNext src/modules/academics/learner-calendar-window-model.ts:27-40 (independent metrics window, 90-day scoped chunks) loaded in src/app/(authenticated)/learn/calendar/page.tsx:45,86 and passed as metricEvents to learner-class-schedule.tsx:~340 (Today/Next use filteredMetrics, not the visible grid) matches docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:122-228.
- G2-19-001-037: OK — vNext src/app/(authenticated)/admin/students/page.tsx:42-48,77-79 (Promise.allSettled isolates filter, registration-choice and import-history reads; roster stays readable; targeted "Retry academic filters/registration options/import history" links; register section only disabled when choices fail) matches docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:485-489,520-523,1476-1479.
- G2-19-003-011: OK — vNext src/app/(authenticated)/admin/course-progress/students/page.tsx:217-218 (Roll number column, scoped learner_profiles.roll_number from src/modules/courses/super-admin-student-course-progress.ts:129) with Student, Videos, Assignments, Quizzes, Progress columns matches docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-205.
- G2-19-018-002: FIXED — unscoped (global) Super Admin now gets the read-only all-hall directory like legacy findAll(), organization-scoped gets the org directory, college-scoped gets the college CRUD view: listSuperAdminOrganizationLectureHalls in src/modules/academics/lecture-hall-service.ts accepts an optional organizationId (requires matching/absent adminScope.organizationId, academics.read), src/app/(authenticated)/admin/lecture-halls/page.tsx calls it for any Super Admin without a college; also fixed corrupted search-escape string there; test tests/unit/superadmin-lecture-hall-organization-browse-verify2b.test.ts updated. Matches LectureHallController.java:80-101.
- G2-19-018-037: OK — vNext src/modules/academics/lecture-hall-service.ts:209-226 (authorize: Super Admin must have the hall's college selected, plus requirePermission academics.manage with organization+college resource; hall college always from the stored row at :402-405) matches LectureHallController.java:60-74,139-152 (scoped-SA college/org checks + requirePerformAdminActionForCollege).
- G2-19-018-038: FIXED — non-SA room reads: listLectureHalls takes an optional permission; the legacy fetch adapters searchLectureHallsForPicker and listLectureHallsLegacyPage (src/modules/academics/lecture-hall-service.ts) request academics.read (same-college members only) while the admin directory and all writes keep academics.manage. Matches LectureHallController.java:80-101.
- G2-19-018-041: OK — vNext src/modules/academics/lecture-hall-service.ts:28-33,408-428 + lecture-hall-conflict-model.ts (no physical delete; archiving is blocked with HALL_IN_USE while any SCHEDULED upcoming event references the room, capacity reduction blocked below scheduled class capacity, past bookings keep their FK) is the deliberate safe lifecycle for LectureHallServiceImpl.java:143-153 (delete blocked whenever schedules reference the room).
