# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-9-008-075  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-008-078  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-008-079  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-015-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-015-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-015-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-015-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-016-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-016-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-022-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_13.md)

## Results

- G2-9-008-075: OK — vNext src/modules/placements/college-hiring-funnel-service.ts:113-130 (observedStageCount = current stage OR any history row with that to/from stage, scoped by cohort/program/department via academicFilter at :103) matches docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2385-2429 (reachedStageSql EXISTS over status history).
- G2-9-008-078: OK — vNext college-hiring-funnel-service.ts:79-84 (shortlist time from placement_college_application_stage_history, min moved_at where to_stage=SHORTLISTED, truncated seconds, avg at :140-142) maps AdminJobServiceImpl.java:2294-2329 (job_application_status_history MIN changed_at, TIMESTAMPDIFF SECOND, AVG, Math.round(*1000)).
- G2-9-008-079: OK — vNext college-hiring-funnel-service.ts:172-183 (normalizedSubtotals keyed by trimmed, whitespace-collapsed, lowercase company name) matches AdminJobServiceImpl.java:2470-2526 (groupingBy trim().toLowerCase of companyName with company total rows).
- G2-9-015-015: OK — vNext src/components/placements/college-drives-quick-filters.tsx:36-38 (All default, Draft, Active, Closed, plus extra Archived state) used by src/app/(authenticated)/college/placements/drives/page.tsx (status defaults to ALL) matches docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:710-718.
- G2-9-015-028: OK — vNext src/modules/placements/college-drive-read-model.ts:5 (status default ALL) and college-drive-read-service.ts:87-91 (ALL applies no status filter; DRAFT/PUBLISHED/CLOSED map to isDraft/isActive) matches Jobs.js:487-502.
- G2-9-015-032: OK — vNext college-drive-read-model.ts:8,12 (sort default NEWEST, pageSize default 20) with college-drive-read-service.ts:111 (NEWEST orders by posted_at DESC) matches Jobs.js:256-264.
- G2-9-015-067: OK — vNext college-drive-read-model.ts:5 + college-drive-read-service.ts:33-34,87-91 (all/draft/active/closed categories, archived excluded from active/inactive counts) matches Jobs.js:254-265.
- G2-9-016-024: OK — vNext src/modules/placements/college-drive-attention-service.ts:48-53,229 (activeDriveCount, allDriveCount, inactiveDriveCount from one count query over non-archived drives) matches docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:251-257.
- G2-9-016-025: OK — vNext college-drive-attention-service.ts:12,126-146 (STALE_APPLIED, INTERVIEW_UNSCHEDULED, MISSING_OFFER_LETTER, LOW_CONVERSION all evidence-backed) matches DrivesLanding.js:19-26.
- G2-9-022-034: FIXED — confirmation dialog now shows "This will affect N students across M classes" plus the legacy "This will:" impact list (semester change, N faculty assignments deactivated, students see new courses, academic-year advance, program max semester) in src/components/academics/college-promotion-confirmation.tsx; preview returns activeClasses and endingFacultyAssignments in src/modules/academics/college-batch-promotion-service.ts; src/app/(authenticated)/college/batch-promotion/page.tsx and src/app/(authenticated)/admin/batch-promotion/page.tsx pass the new props.
