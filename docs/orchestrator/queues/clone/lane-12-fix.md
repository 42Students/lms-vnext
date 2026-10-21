# Gap FIX queue: lane chat-12

33 audit documents, 1329 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-12.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-12-b with [chat-12] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-12/courses.md` (P0:3 P1:31 P2:39 P3:4 open:77)
- [ ] `docs/audit/gap2/lane-12/job-application.md` (P0:0 P1:29 P2:25 P3:0 open:54)
- [ ] `docs/audit/gap2/lane-12/semester-courses.md` (P0:0 P1:19 P2:41 P3:6 open:66)
- [ ] `docs/audit/gap2/lane-12/placement-cell.md` (P0:0 P1:16 P2:55 P3:1 open:72)
- [ ] `docs/audit/gap2/lane-12/l18-u020-class-schedule.md` (P0:0 P1:20 P2:14 P3:0 open:34)
- [ ] `docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md` (P0:0 P1:19 P2:17 P3:0 open:36)
- [ ] `docs/audit/gap2/lane-12/new-program-structure.md` (P0:0 P1:18 P2:22 P3:1 open:41)
- [ ] `docs/audit/gap2/lane-12/project-task-comment.md` (P0:0 P1:17 P2:28 P3:2 open:47)
- [ ] `docs/audit/gap2/lane-12/placement-applications.md` (P0:0 P1:16 P2:35 P3:4 open:55)
- [ ] `docs/audit/gap2/lane-12/all-assignments.md` (P0:0 P1:14 P2:44 P3:4 open:62)
- [ ] `docs/audit/gap2/lane-12/company-domain.md` (P0:0 P1:16 P2:24 P3:1 open:41)
- [ ] `docs/audit/gap2/lane-7/u010-college-admin-workspace-meetings.md` (P0:0 P1:13 P2:34 P3:2 open:49)
- [ ] `docs/audit/gap2/lane-12/l17-u029-tenant-settings.md` (P0:0 P1:13 P2:27 P3:0 open:40)
- [ ] `docs/audit/gap2/lane-9/college-admin-audit.md` (P0:0 P1:11 P2:38 P3:0 open:49)
- [ ] `docs/audit/gap2/lane-12/l18-u016-quiz-attempt.md` (P0:0 P1:13 P2:13 P3:0 open:26)
- [ ] `docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md` (P0:0 P1:12 P2:10 P3:0 open:22)
- [ ] `docs/audit/gap2/lane-5/u017-project-template-version.md` (P0:0 P1:10 P2:22 P3:4 open:36)
- [ ] `docs/audit/gap2/lane-5/u025-semester-controller.md` (P0:0 P1:9 P2:32 P3:3 open:44)
- [ ] `docs/audit/gap2/lane-10/l15-u028-superadmin-workspace-sprints.md` (P0:0 P1:8 P2:29 P3:5 open:42)
- [ ] `docs/audit/gap2/lane-3/faculty-course-association.md` (P0:0 P1:8 P2:28 P3:1 open:37)
- [ ] `docs/audit/gap2/lane-9/l18-u013-job-search-cache.md` (P0:0 P1:5 P2:28 P3:4 open:37)
- [ ] `docs/audit/gap2/lane-12/request-demo.md` (P0:0 P1:5 P2:25 P3:2 open:32)
- [ ] `docs/audit/gap2/lane-9/college-admin-departments.md` (P0:0 P1:4 P2:34 P3:0 open:38)
- [ ] `docs/audit/gap2/lane-3/job-application-status-history-service.md` (P0:0 P1:5 P2:24 P3:4 open:33)
- [ ] `docs/audit/gap2/lane-3/l15-u021-announcement-model.md` (P0:0 P1:4 P2:30 P3:0 open:34)
- [ ] `docs/audit/gap2/lane-2/client-settings-controller.md` (P0:0 P1:5 P2:19 P3:3 open:27)
- [ ] `docs/audit/gap2/lane-9/college-admin-verification.md` (P0:0 P1:4 P2:28 P3:2 open:34)
- [ ] `docs/audit/gap2/lane-3/l14-u026-program-controller.md` (P0:0 P1:3 P2:37 P3:4 open:44)
- [ ] `docs/audit/gap2/lane-2/announcement-controller.md` (P0:0 P1:3 P2:25 P3:2 open:30)
- [ ] `docs/audit/gap2/lane-6/organization.md` (P0:0 P1:3 P2:17 P3:1 open:21)
- [ ] `docs/audit/gap2/lane-12/youtube.md` (P0:0 P1:1 P2:36 P3:3 open:40)
- [ ] `docs/audit/gap2/lane-12/mentor-course-redirect.md` (P0:0 P1:3 P2:12 P3:4 open:19)
- [ ] `docs/audit/gap2/lane-2/base-controller.md` (P0:0 P1:1 P2:4 P3:5 open:10)
