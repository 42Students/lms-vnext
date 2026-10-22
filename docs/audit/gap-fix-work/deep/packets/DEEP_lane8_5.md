# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-3-005-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [x] G2-3-005-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [x] G2-3-005-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [x] G2-3-025-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [x] G2-3-025-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [x] G2-3-025-071  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [x] G2-4-004-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [x] G2-4-004-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [x] G2-4-004-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [x] G2-4-004-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)

## Results

- G2-3-005-036: OK — vNext src/components/courses/college-quiz-attempts.tsx:56-57,108-117 lists every authorized Section delivery of the quiz's offering in a Section selector with paged reads per section (complete cross-section access); legacy docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:29-42.
- G2-3-005-038: OK — vNext src/modules/courses/college-assessment-aggregate-service.ts:68-98 scopes every read to the SSR adminScope college and src/app/(authenticated)/admin/quizzes/page.tsx:103,111 keys the client components by college id so dialogs/filters remount on college change; legacy Quizzes.js:128-155.
- G2-3-005-055: OK — vNext src/components/courses/college-quiz-actions.tsx:33,57,99,104-107,118,168 uses an in-flight ref lock plus disabled Edit/Delete/Save while busy; legacy Quizzes.js:287-319 mutationLocksRef.
- G2-3-025-040: OK — vNext src/modules/courses/learner-course-preferred-period-model.ts:3-13 picks the current (non-read-only) latest period and src/components/courses/learner-course-list.tsx:157-171 falls back from invalid/foreign requested semester to it; legacy StudentCourseServiceImpl.java:162-181.
- G2-3-025-061: OK — vNext src/components/courses/learner-course-list.tsx:159-171,244-253 tracks requestedSemesterId, computes semesterFallbackApplied and shows "The requested semester was unavailable" with a Use current semester reset; legacy StudentCourseController.java:45-51.
- G2-3-025-071: OK — vNext src/app/api/courses/learner/route.ts:15-27 deliberately rejects studentId/classId overrides (403) for the learner endpoint; staff class rosters use separate permission-checked staff routes (src/app/api/courses/faculty/* and src/app/api/courses/deliveries/route.ts), so no feature is absent; legacy StudentCourseController.java:98-125.
- G2-4-004-010: OK — vNext src/components/courses/college-assessment-course-section-filters.tsx:36-37 searchable course picker (datalist, placeholder All courses) fed by authorized directoryCourses; legacy Assignments.js:403-407.
- G2-4-004-011: OK — vNext src/components/courses/college-assessment-course-section-filters.tsx:48-51 section select (All scopes) disabled until a course with sections is chosen; legacy Assignments.js:408-413.
- G2-4-004-022: OK — vNext src/components/courses/college-assessment-aggregate.tsx:218-219 shows submitted/eligible and graded plus Not graded (submitted minus graded) with the denominator semantics note at :281-284; legacy Assignments.js:350-358.
- G2-4-004-072: OK — vNext src/components/courses/college-assessment-aggregate.tsx:84-90 offers Export CSV (page) plus separately labeled Export all matching; src/modules/courses/college-assessment-export-model.ts:45-67 legacy columns and src/app/api/academics/college-assessment-export/assignment/route.ts:13 filename assignments-college-ID-page-P.csv; legacy Assignments.js:329-341.
