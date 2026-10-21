# Gap FIX queue: lane chat-7

24 audit documents, 1470 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-7.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-7-b with [chat-7] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-7/u035-superadmin-template-overview.md` (P0:1 P1:33 P2:32 P3:0 open:66)
- [ ] `docs/audit/gap2/lane-7/u030-superadmin-project-audit.md` (P0:1 P1:17 P2:44 P3:0 open:62)
- [ ] `docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md` (P0:1 P1:12 P2:33 P3:2 open:48)
- [ ] `docs/audit/gap2/lane-7/u032-superadmin-readiness.md` (P0:1 P1:10 P2:45 P3:1 open:57)
- [ ] `docs/audit/gap2/lane-7/u029-superadmin-at-risk.md` (P0:1 P1:7 P2:59 P3:1 open:68)
- [ ] `docs/audit/gap2/lane-7/l19-u027-course-controller.md` (P0:0 P1:38 P2:36 P3:6 open:80)
- [ ] `docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md` (P0:0 P1:29 P2:50 P3:1 open:80)
- [ ] `docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md` (P0:0 P1:28 P2:58 P3:2 open:88)
- [ ] `docs/audit/gap2/lane-7/u017-college-admin-workspace-team.md` (P0:0 P1:27 P2:47 P3:0 open:74)
- [ ] `docs/audit/gap2/lane-7/u018-college-admin-deleted-workspaces.md` (P0:0 P1:25 P2:35 P3:1 open:61)
- [ ] `docs/audit/gap2/lane-7/l14-u030-super-admin-interview-edit-form.md` (P0:0 P1:23 P2:26 P3:2 open:51)
- [ ] `docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md` (P0:0 P1:20 P2:48 P3:0 open:68)
- [ ] `docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md` (P0:0 P1:21 P2:32 P3:9 open:62)
- [ ] `docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md` (P0:0 P1:20 P2:40 P3:2 open:62)
- [ ] `docs/audit/gap2/lane-7/u002-college-admin-projects-audit.md` (P0:0 P1:20 P2:33 P3:7 open:60)
- [ ] `docs/audit/gap2/lane-7/u016-college-admin-workspace-tasks.md` (P0:0 P1:18 P2:41 P3:0 open:59)
- [ ] `docs/audit/gap2/lane-7/u021-college-admin-mentor-reassignment.md` (P0:0 P1:17 P2:47 P3:2 open:66)
- [ ] `docs/audit/gap2/lane-7/l18-u031-people-management-end-to-end.md` (P0:0 P1:18 P2:34 P3:4 open:56)
- [ ] `docs/audit/gap2/lane-7/l18-u021-job-important-date-event-dto.md` (P0:0 P1:19 P2:21 P3:3 open:43)
- [ ] `docs/audit/gap2/lane-7/l12-u027-faculty-teaching-assignment-controller.md` (P0:0 P1:19 P2:20 P3:2 open:41)
- [ ] `docs/audit/gap2/lane-7/l17-u031-projects-end-to-end.md` (P0:0 P1:20 P2:10 P3:1 open:31)
- [ ] `docs/audit/gap2/lane-7/u014-college-admin-workspace-sprints.md` (P0:0 P1:16 P2:49 P3:2 open:67)
- [ ] `docs/audit/gap2/lane-7/u027-mentor-project-detail.md` (P0:0 P1:16 P2:36 P3:0 open:52)
- [ ] `docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md` (P0:0 P1:14 P2:48 P3:6 open:68)
