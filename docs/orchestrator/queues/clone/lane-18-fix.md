# Gap FIX queue: lane chat-18

28 audit documents, 1366 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-18.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-18-b with [chat-18] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-18/u003-superadmin-courses.md` (P0:0 P1:31 P2:53 P3:8 open:92)
- [ ] `docs/audit/gap2/lane-18/college-admin-lesson-content.md` (P0:0 P1:32 P2:41 P3:7 open:80)
- [ ] `docs/audit/gap2/lane-18/job-service-impl.md` (P0:0 P1:24 P2:30 P3:3 open:57)
- [ ] `docs/audit/gap2/lane-18/u002-superadmin-lessons.md` (P0:0 P1:18 P2:69 P3:13 open:100)
- [ ] `docs/audit/gap2/lane-18/tpo-mail-service.md` (P0:0 P1:18 P2:32 P3:6 open:56)
- [ ] `docs/audit/gap2/lane-18/notification-service.md` (P0:0 P1:18 P2:25 P3:1 open:44)
- [ ] `docs/audit/gap2/lane-18/course-attendance-report.md` (P0:0 P1:14 P2:49 P3:10 open:73)
- [ ] `docs/audit/gap2/lane-18/u004-learner-notifications.md` (P0:0 P1:15 P2:37 P3:16 open:68)
- [ ] `docs/audit/gap2/lane-18/learner-calendar.md` (P0:0 P1:15 P2:26 P3:8 open:49)
- [ ] `docs/audit/gap2/lane-18/u005-learner-placements-home.md` (P0:0 P1:13 P2:45 P3:11 open:69)
- [ ] `docs/audit/gap2/lane-7/u001-college-admin-projects-at-risk.md` (P0:0 P1:13 P2:29 P3:6 open:48)
- [ ] `docs/audit/gap2/lane-18/u001-faculty-course-tab.md` (P0:0 P1:10 P2:44 P3:8 open:62)
- [ ] `docs/audit/gap2/lane-5/l17-u029-tenant-settings.md` (P0:0 P1:10 P2:28 P3:3 open:41)
- [ ] `docs/audit/gap2/lane-4/tpo-students-hub-controller.md` (P0:0 P1:9 P2:26 P3:2 open:37)
- [ ] `docs/audit/gap2/lane-10/superadmin-projects-workspaces.md` (P0:0 P1:8 P2:32 P3:6 open:46)
- [ ] `docs/audit/gap2/lane-3/l11-u016-tpo-messages.md` (P0:0 P1:5 P2:59 P3:4 open:68)
- [ ] `docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md` (P0:0 P1:8 P2:26 P3:0 open:34)
- [ ] `docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md` (P0:0 P1:6 P2:29 P3:4 open:39)
- [ ] `docs/audit/gap2/lane-3/l12-u009-course-classroom-discussion.md` (P0:0 P1:3 P2:48 P3:2 open:53)
- [ ] `docs/audit/gap2/lane-3/l18-u027-department-controller.md` (P0:0 P1:3 P2:35 P3:5 open:43)
- [ ] `docs/audit/gap2/lane-3/superadmin-workspace-delivery.md` (P0:0 P1:2 P2:37 P3:7 open:46)
- [ ] `docs/audit/gap2/lane-7/u006-college-admin-project-templates.md` (P0:0 P1:3 P2:27 P3:7 open:37)
- [ ] `docs/audit/gap2/lane-18/syllabus-liveclass.md` (P0:0 P1:1 P2:26 P3:18 open:45)
- [ ] `docs/audit/gap2/lane-7/u025-mentor-landing.md` (P0:0 P1:1 P2:23 P3:2 open:26)
- [ ] `docs/audit/gap2/lane-8/learner-placement-assessments-moved.md` (P0:0 P1:2 P2:8 P3:0 open:10)
- [ ] `docs/audit/gap2/lane-8/learner-placement-rules-moved.md` (P0:0 P1:2 P2:8 P3:0 open:10)
- [ ] `docs/audit/gap2/lane-6/project-template-college.md` (P0:0 P1:1 P2:9 P3:0 open:10)
- [ ] `docs/audit/gap2/lane-4/api-ai-grading-health.md` (P0:0 P1:0 P2:0 P3:23 open:23)
