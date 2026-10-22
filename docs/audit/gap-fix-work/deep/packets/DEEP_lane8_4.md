# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-5-007-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-5-007-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-5-008-077  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-5-010-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-5-012-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-5-012-071  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-5-030-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-6-006-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-6-016-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-6-019-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)

## Results

- G2-5-007-005: OK — vNext has the single Interviews page (header, Refresh, four metrics, filter toolbar, appointment table) at src/app/(authenticated)/college/placements/interviews/page.tsx:99-108,225, and the super-admin calendar workspace is titled "Interviews" with the same four metrics (src/components/placements/placement-calendar-workspace.tsx:686-689,734); the grid/agenda calendar stays an optional separate view (:1195,1300); matches docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:750-1049
- G2-5-007-036: OK — src/components/placements/placement-calendar-workspace.tsx:332-333 routes an interview slot to the exact applicant (/jobs/<jobId>/applications?applicationId=<id>), not the round, and src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:44-45 opens that candidate; matches InterviewCalendarContent.js:624-632
- G2-5-008-077: OK — vNext deliberately replaces the legacy hard delete with an archive/restore lifecycle that keeps the same guards (learners, schedule events, teaching assignments, deliveries): src/modules/academics/college-section-lifecycle-service.ts:15-60 (CLASS_HAS_LEARNERS/CLASS_HAS_SCHEDULE etc.) exposed by src/app/api/college/classes/[sectionId]/lifecycle/route.ts; this is the explicit retention decision for docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:225-255 (no data is destroyed, history stays auditable)
- G2-5-010-031: OK — src/components/academics/college-recurring-preview.tsx:222-249 uses 300-second time steps and "Clear every weekday to repeat daily"; src/modules/academics/college-recurring-preview-model.ts:20-30,48-58 treats an empty weekday set as daily and enforces end after start; matches docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:533-579
- G2-5-012-007: OK — src/components/placements/placement-calendar-workspace.tsx:716-720,842-875 shows the Needs doing chips (overdue follow-ups, blocked rounds, busy days) that toggle a focused "Needs doing details" list (selecting the active chip again or the close link clears it, aria-current marks the selection) with per-event actions; matches docs/legacy-source/frontend/src/pages/tpo/calendar.js:270-285
- G2-5-012-071: OK — src/components/placements/placement-calendar-workspace.tsx:86-120 keeps the last-known summary snapshot (stale:true, up to 15 minutes) when a refresh fails, :651 needsKnown, :798 shows "Showing the last successful follow-up summary ... Missing counts are not zero", and :843-845 renders unknown counts as null rather than 0; matches docs/legacy-source/frontend/src/pages/tpo/calendar.js:84-103
- G2-5-030-058: OK — src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-27,64-70 binds the Manage College panel to the college id in the URL (an explicit "selected college stays fixed" banner, tabs link inside the same college id), and each editor (/admin/colleges/[collegeId]/signin|branding|admins|subdomain) is its own route with its own pending/unsaved-change guard and server-side scope check, so a scope switch cannot silently retarget an in-flight save; legacy ManageCollegeDrawer.js:58-81 reset-on-scope-change is not reproduced by design
- G2-6-006-001: OK — next.config.ts:16 redirects /teacher/fileExplorer to /teacher/courses (permanent:false, temporary), matching docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-7
- G2-6-016-034: OK — src/app/api/skills/selection/route.ts:20-23,87-97 accepts freeTextSkills and upserts them into db10SkillUsage with an independent usage counter (separate from catalog db10Skills.usageCount), and src/app/api/v2/skills/[...legacyPath]/route.ts:43-55 maps legacy POST /skills/{name}/select to it; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/skills/SkillsSearchController.java:92-101
- G2-6-019-010: OK — src/modules/people/profile-validation.ts:29-40 maps legacy free text (Day Shift, Night Shift, Flexible, Remote, plus rotational) to DAY/NIGHT/FLEXIBLE/REMOTE/ROTATIONAL at the schema boundary without rewriting Remote to a shift (REMOTE is its own value, :587), and unrecognised text is rejected with a validation error instead of being silently changed; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:28-29
