# Gap FIX queue: lane chat-15

34 audit documents, 1347 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-15.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-15-b with [chat-15] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md` (P0:2 P1:24 P2:30 P3:3 open:59)
- [ ] `docs/audit/gap2/lane-15/u002-student-placement-lookup.md` (P0:0 P1:27 P2:39 P3:0 open:66)
- [ ] `docs/audit/gap2/lane-15/l18-u031-people-management.md` (P0:0 P1:23 P2:34 P3:2 open:59)
- [ ] `docs/audit/gap2/lane-15/u003-superadmin-lessons.md` (P0:0 P1:21 P2:44 P3:4 open:69)
- [ ] `docs/audit/gap2/lane-15/take-attendance.md` (P0:0 P1:22 P2:33 P3:6 open:61)
- [ ] `docs/audit/gap2/lane-15/notification-service-impl.md` (P0:0 P1:18 P2:28 P3:1 open:47)
- [ ] `docs/audit/gap2/lane-15/recruiter.md` (P0:0 P1:17 P2:22 P3:1 open:40)
- [ ] `docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md` (P0:0 P1:18 P2:11 P3:0 open:29)
- [ ] `docs/audit/gap2/lane-15/u008-syllabus-detail.md` (P0:0 P1:16 P2:28 P3:0 open:44)
- [ ] `docs/audit/gap2/lane-15/job-round-repository.md` (P0:0 P1:15 P2:20 P3:0 open:35)
- [ ] `docs/audit/gap2/lane-10/superadmin-electives.md` (P0:0 P1:12 P2:48 P3:4 open:64)
- [ ] `docs/audit/gap2/lane-15/email-variable-validator.md` (P0:0 P1:15 P2:12 P3:0 open:27)
- [ ] `docs/audit/gap2/lane-15/u006-learner-courses.md` (P0:0 P1:13 P2:32 P3:1 open:46)
- [ ] `docs/audit/gap2/lane-7/u028-mentor-projects-list.md` (P0:0 P1:11 P2:45 P3:2 open:58)
- [ ] `docs/audit/gap2/lane-15/u001-teacher-courses.md` (P0:0 P1:13 P2:23 P3:2 open:38)
- [ ] `docs/audit/gap2/lane-15/u004-learner-projects.md` (P0:0 P1:12 P2:28 P3:4 open:44)
- [ ] `docs/audit/gap2/lane-15/sms-service.md` (P0:0 P1:12 P2:18 P3:3 open:33)
- [ ] `docs/audit/gap2/lane-15/l18-u013-job-search-cache.md` (P0:0 P1:12 P2:13 P3:3 open:28)
- [ ] `docs/audit/gap2/lane-15/l18-u028-superadmin-workspace-overview.md` (P0:0 P1:11 P2:19 P3:0 open:30)
- [ ] `docs/audit/gap2/lane-9/superadmin-audit-hub.md` (P0:0 P1:9 P2:35 P3:2 open:46)
- [ ] `docs/audit/gap2/lane-15/job-eligibility-override.md` (P0:0 P1:10 P2:22 P3:1 open:33)
- [ ] `docs/audit/gap2/lane-15/learner-search-controller.md` (P0:0 P1:7 P2:41 P3:11 open:59)
- [ ] `docs/audit/gap2/lane-5/u005-recruiter-calendar.md` (P0:0 P1:8 P2:31 P3:6 open:45)
- [ ] `docs/audit/gap2/lane-2/admin-attendance-policy-controller.md` (P0:0 P1:9 P2:17 P3:9 open:35)
- [ ] `docs/audit/gap2/lane-3/tpo-team-thread-controller.md` (P0:0 P1:7 P2:33 P3:0 open:40)
- [ ] `docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md` (P0:0 P1:7 P2:28 P3:1 open:36)
- [ ] `docs/audit/gap2/lane-9/l17-u023-learner-offer-controller.md` (P0:0 P1:7 P2:26 P3:1 open:34)
- [ ] `docs/audit/gap2/lane-15/l20-u031-public-pages.md` (P0:0 P1:6 P2:19 P3:3 open:28)
- [ ] `docs/audit/gap2/lane-15/u007-college-admin-student-groups.md` (P0:0 P1:7 P2:4 P3:0 open:11)
- [ ] `docs/audit/gap2/lane-3/learner-saved-job.md` (P0:0 P1:5 P2:24 P3:3 open:32)
- [ ] `docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md` (P0:0 P1:2 P2:17 P3:7 open:26)
- [ ] `docs/audit/gap2/lane-6/l13-u022-tpo-request-controller.md` (P0:0 P1:3 P2:5 P3:0 open:8)
- [ ] `docs/audit/gap2/lane-6/semester-search-controller.md` (P0:0 P1:1 P2:24 P3:0 open:25)
- [ ] `docs/audit/gap2/lane-2/r2-config.md` (P0:0 P1:2 P2:8 P3:2 open:12)
