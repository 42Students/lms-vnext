# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-9-022-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_13.md)
- [x] G2-9-023-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_13.md)
- [x] G2-9-023-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_13.md)
- [x] G2-9-029-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_13.md)
- [x] G2-9-029-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_13.md)
- [x] G2-9-029-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_13.md)
- [x] G2-18-006-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-18-006-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-18-006-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-18-006-041  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)

## Results

- G2-9-022-058: OK — vNext src/modules/academics/college-batch-promotion-service.ts:55-61,114 (limit/offset) and src/app/(authenticated)/admin/batch-promotion/page.tsx:40-44,136 use server pagination; improves on docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:47-72 client paging.
- G2-9-023-017: OK — src/components/academics/college-cohort-management.tsx:332,412-420,452 expose lifecycle actions (Archive planned, Mark graduated for ACTIVE); Inactive deliberately unsupported (line 452); legacy Batches.js:49-56.
- G2-9-023-029: OK — src/components/academics/college-cohort-management.tsx:263 and src/modules/academics/college-cohort-mutation-service.ts:147 deliberately start new batches as Planned (ACTIVE only when starting period is active), documented in UI; legacy Batches.js:378-393 forced ACTIVE.
- G2-9-029-015: OK — src/app/(authenticated)/admin/batches/page.tsx:124-125 show Classes (activeSections) and Students (activeEnrolledLearners) columns matching docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:475-477.
- G2-9-029-017: OK — same as G2-9-023-017 (college-cohort-management.tsx:332,412-420,452; legacy Batches.js:49-56).
- G2-9-029-029: OK — same as G2-9-023-029 (college-cohort-management.tsx:263; college-cohort-mutation-service.ts:147; legacy Batches.js:378-393).
- G2-18-006-032: OK — src/components/academics/learner-class-schedule.tsx:523-532,894-902 "+N more" opens overflow dialog listing all day sessions; matches StandardCalendar.js overflow popup.
- G2-18-006-036: OK — src/app/(authenticated)/learn/calendar/page.tsx:43-58,86 loads separate metric windows (learnerCalendarMetricWindows) independent of visible month, matching legacy ClassScheduleContent.jsx:122-196 (today..+180d).
- G2-18-006-040: OK — src/modules/academics/learner-schedule-service.ts:138-142 includes COMPLETED/WITHDRAWN enrollments in ACTIVE/CLOSED periods overlapping the visible window (history), matching ClassScheduleServiceImpl.java:1041-1069 class+date-range lookup.
- G2-18-006-041: FIXED — Today/Next metrics were being narrowed by grid course/section/search/kind/upcoming filters; now use unfiltered independent metric source in src/components/academics/learner-class-schedule.tsx (filteredMetrics = metricEvents ?? events), matching ClassScheduleContent.jsx:122-228.
