# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-18-026-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-19-019-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-19-022-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-19-029-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-3-025-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_9.md)

## Results

- G2-18-026-001: FIXED — the compatibility route src/app/api/v1/new-program/[...action]/route.ts now maps all nine legacy NewProgramController operations (create, fetchAll, fetchByDept, fetchByCollege, fetch/{id}, update/{id}, delete/{id}, fetchProgramDetails?programId=, fetchByCollegePaged): added the missing fetchByDept, fetch/{id}, fetchProgramDetails?programId= and fetchByCollegePaged aliases and made fetchAll/fetchByDept resolve to the caller's selected or own college (UUIDs only, never an unscoped global read); /api/v1/program/[...action] re-exports it. Matches docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:26-227.
- G2-19-019-014: OK — vNext src/modules/courses/faculty-course-service.ts:48-60,78-250 (listFacultyCourseDeliveries: active FACULTY membership + active user + role joins, active delivery/offering/section, not-ended/not-deleted grant with legacy start/end dates, and sectionId (class), cohortId (batch) and academicPeriodId (semester/year) filters that combine as class+semester and batch+semester) matches docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyTeachingAssignmentRepository.java:43-81.
- G2-19-022-007: FIXED — TPO Home needsYou parity: added the FOLLOW_UPS and RECRUITER_ACCESS cards (persisted CRM counts) alongside the existing REGISTRATION_CLOSED, deadline (DEADLINE_TODAY/CLOSING_SOON/NO_DEADLINE), operational (RESULTS_READY etc.), RECRUITER_MESSAGES, REQUESTS and TEAM_ASKS cards in src/app/(authenticated)/tpo/home/page.tsx. Field map vs TpoHubController.java:47-66 / TpoInsightsService.java:278-418: needsYou -> homeNeeds + buildTpoLegacyNextUp; numbers -> students/eligibility rows; thisWeek -> weekEvents and "This week" row; team -> team threads row (asks/mentions/unread); seasonId -> ?seasonId route parameter; companyFunnel -> Engage row (leads, follow-ups, access).
- G2-19-029-016: FIXED — added legacyDomainLoginVerdict in src/modules/colleges/legacy-domain-login-readiness.ts (READY, READY_WITH_WARNINGS, BLOCKED from readyForDomainLogin and warnings; UNKNOWN only for unavailable evidence, never conflated with warnings) and render it on src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx separate from the broader go-live checklist; matches docs/legacy-source/frontend/src/pages/superadmin/sections/ReadinessGate.js:158-165.
- G2-3-025-034: FIXED — recorded the 3-to-many endpoint mapping in the route contract comment of src/app/api/courses/learner/route.ts: byStudent -> GET /api/courses/learner[?semesterId|academicPeriodId], byStudent/semesters -> ?view=semesters (both implemented in that file), byClass -> staff-only class/section pages and faculty deliveries, never a learner override; matches docs/legacy-source/frontend/src/api/Services/SemesterService.js:49-67.
