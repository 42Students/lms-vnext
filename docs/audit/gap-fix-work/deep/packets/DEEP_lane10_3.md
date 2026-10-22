# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-7-030-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-11-026-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-11-029-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-13-023-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-14-029-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-14-030-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-17-031-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-19-027-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-5-022-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-5-022-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)

## Results

- G2-7-030-070: OK — vNext src/components/projects/project-admin-audit-page.tsx:174-176,458-459 fetches 200 actions for bounded ranges and 25 for All time, with cursor paging and an explicit "Counts are minimums for this page" disclosure when coverage is partial; matches docs/legacy-source/frontend/src/pages/college-admin/projects/audit/index.js:100-115 (WIDE_RANGE_SIZE 200 / PAGED_SIZE 25).
- G2-11-026-001: OK — vNext deliberately has no unauthenticated bug-tracker API: reporter intake and attachments go through authenticated routes (src/app/api/bug-tracker/reports/[publicId]/attachments/route.ts uses getCurrentRequestContext + same-origin check; tracker UI under src/app/(authenticated)/tracker/*), so there are no public manager writes; PublicBugTrackerController.java:15-18 public base is intentionally replaced by the secured surface.
- G2-11-029-034: OK — vNext src/components/projects/project-editor-discard-guard.ts:11-70 (beforeunload, capture-phase in-app link clicks, Navigation API for Back/Forward, accessible discard Dialog) replaces docs/legacy-source/frontend/src/components/admin/projects/useUnsavedFormGuard.js:17-55, wired into all project editors.
- G2-13-023-010: OK — vNext src/modules/placements/request-service.ts:1269-1395 lists learner rounds only for SUBMITTED + SHORTLISTED applications of PUBLISHED jobs with SCHEDULED rounds and a separate booked flag (exists BOOKED slot at :1277-1281); schedule route src/app/api/placements/learner/schedule/route.ts partitions ahead/past/undated. Matches TpoScheduleService.java:335-340.
- G2-14-029-027: OK — vNext src/app/(authenticated)/tpo/batches/[batchId]/page.tsx:66-110 renders separate "Batch details may be stale", roster/eligibility, registration-profile, history and invite-readiness banners each with a Retry link; matches docs/legacy-source/frontend/src/pages/tpo/batches/[batchId].js:386-414.
- G2-14-030-036: OK — vNext src/modules/placements/college-drive-read-service.ts:12-20 requireCollegePlacementAdmin (College Admin own membership college, Super Admin only the persisted selected college via resolveActingCollege + requirePlacementManageScope) used by college-interview-action/feedback/directory/drive-interviews services, all filtered by that collegeId; matches InterviewController.java:80-117 college-scope guard.
- G2-17-031-002: OK — vNext mentor editors (mentor-task-create, mentor-meeting-reschedule, mentor-sprint-details-edit, etc.) use src/components/projects/project-editor-discard-guard.ts and src/modules/projects/project-navigation-guard-model.ts so an in-progress draft is never silently lost on tab/section navigation (fragment jumps keep it mounted, cross-route navigation asks to discard); equivalent of docs/legacy-source/frontend/src/pages/mentor/projects/[projectId].js:7-17 key preservation.
- G2-19-027-062: OK — vNext src/modules/courses/course-service.ts:550-616 archiveCourse blocks on active offerings, any lesson (including non-active offerings' lessons, COURSE_HAS_LESSONS) and lesson content (COURSE_HAS_LESSON_CONTENT) independently inside one transaction; matches CourseServiceImpl.java:168-186.
- G2-5-022-009: OK — vNext src/modules/placements/tpo-students-service.ts:309-314,1046-1057 exposes only privateContactAvailability flags (mobile present, clean resume available), never the raw phone or resume object path in the broad roster (comment at :979); raw contact/resume need separate authorized need-to-know actions, replacing StudentSummaryDTO.java:22-41 contactMobile/resumeUrl.
- G2-5-022-044: OK — vNext src/modules/placements/tpo-students-service.ts:427-465 pushes branch/program/batch/CGPA/backlog/percentage/passing-year/lateral/verified predicates into the SQL where clause and returns a paged roster (pageSize 1-100, default 25, :97,1399-1450) instead of the legacy single 5000-row page (TpoStudentController.java:37-48); remaining derived journey filters run on the already college-scoped set.
