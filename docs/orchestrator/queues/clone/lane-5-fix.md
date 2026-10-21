# Gap FIX queue: lane chat-5

28 audit documents, 1456 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-5.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-5-b with [chat-5] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md` (P0:5 P1:31 P2:14 P3:1 open:51)
- [ ] `docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md` (P0:2 P1:21 P2:15 P3:0 open:38)
- [ ] `docs/audit/gap2/lane-5/u020-discussions.md` (P0:2 P1:9 P2:16 P3:3 open:30)
- [ ] `docs/audit/gap2/lane-5/u016-skill-synonym.md` (P0:2 P1:6 P2:18 P3:2 open:28)
- [ ] `docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md` (P0:1 P1:32 P2:25 P3:1 open:59)
- [ ] `docs/audit/gap2/lane-5/u012-tpo-calendar.md` (P0:1 P1:13 P2:46 P3:8 open:68)
- [ ] `docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md` (P0:0 P1:36 P2:38 P3:2 open:76)
- [ ] `docs/audit/gap2/lane-5/u028-superadmin-projects-section.md` (P0:0 P1:25 P2:37 P3:1 open:63)
- [ ] `docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md` (P0:0 P1:25 P2:32 P3:1 open:58)
- [ ] `docs/audit/gap2/lane-5/u013-admin-job-service.md` (P0:0 P1:25 P2:26 P3:1 open:52)
- [ ] `docs/audit/gap2/lane-5/u019-learner.md` (P0:0 P1:24 P2:27 P3:1 open:52)
- [ ] `docs/audit/gap2/lane-5/l13-u021-application-screening-entity.md` (P0:0 P1:25 P2:16 P3:0 open:41)
- [ ] `docs/audit/gap2/lane-5/u027-learner-controller.md` (P0:0 P1:23 P2:35 P3:0 open:58)
- [ ] `docs/audit/gap2/lane-5/u024-tenant-admin-controller.md` (P0:0 P1:23 P2:22 P3:4 open:49)
- [ ] `docs/audit/gap2/lane-5/u007-superadmin-calendar.md` (P0:0 P1:21 P2:32 P3:4 open:57)
- [ ] `docs/audit/gap2/lane-5/u010-classes-shared-component.md` (P0:0 P1:19 P2:44 P3:4 open:67)
- [ ] `docs/audit/gap2/lane-5/u008-superadmin-classes.md` (P0:0 P1:19 P2:38 P3:6 open:63)
- [ ] `docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md` (P0:0 P1:19 P2:34 P3:0 open:53)
- [ ] `docs/audit/gap2/lane-5/u002-college-admin-calendar.md` (P0:0 P1:19 P2:33 P3:4 open:56)
- [ ] `docs/audit/gap2/lane-5/u003-college-admin-classes.md` (P0:0 P1:17 P2:46 P3:4 open:67)
- [ ] `docs/audit/gap2/lane-5/u006-superadmin-attendance.md` (P0:0 P1:17 P2:34 P3:5 open:56)
- [ ] `docs/audit/gap2/lane-5/u009-attendance-shared-component.md` (P0:0 P1:17 P2:31 P3:6 open:54)
- [ ] `docs/audit/gap2/lane-5/u031-admin-users.md` (P0:0 P1:14 P2:43 P3:0 open:57)
- [ ] `docs/audit/gap2/lane-5/l17-u019-grade-audit-log.md` (P0:0 P1:16 P2:13 P3:0 open:29)
- [ ] `docs/audit/gap2/lane-5/u001-college-admin-attendance.md` (P0:0 P1:13 P2:27 P3:4 open:44)
- [ ] `docs/audit/gap2/lane-5/u014-class-search-controller.md` (P0:0 P1:11 P2:40 P3:7 open:58)
- [ ] `docs/audit/gap2/lane-5/u030-manage-college-drawer.md` (P0:0 P1:10 P2:36 P3:1 open:47)
- [ ] `docs/audit/gap2/lane-5/u022-tpo-student-controller.md` (P0:0 P1:12 P2:12 P3:1 open:25)
