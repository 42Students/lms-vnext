# Gap FIX queue: lane chat-2

28 audit documents, 1454 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-2.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-2-b with [chat-2] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-2/admin-college-dashboard-controller.md` (P0:3 P1:7 P2:27 P3:7 open:44)
- [ ] `docs/audit/gap2/lane-2/admin-notification-delivery-controller.md` (P0:0 P1:34 P2:26 P3:0 open:60)
- [ ] `docs/audit/gap2/lane-2/admin-job-controller.md` (P0:0 P1:26 P2:77 P3:3 open:106)
- [ ] `docs/audit/gap2/lane-2/superadmin-audit-findings-controller.md` (P0:0 P1:29 P2:24 P3:7 open:60)
- [ ] `docs/audit/gap2/lane-2/l17-u026-notification-controller.md` (P0:0 P1:27 P2:21 P3:1 open:49)
- [ ] `docs/audit/gap2/lane-2/admin-assignment-content-write-controller.md` (P0:0 P1:24 P2:30 P3:1 open:55)
- [ ] `docs/audit/gap2/lane-2/admin-learner-progress-controller.md` (P0:0 P1:24 P2:24 P3:0 open:48)
- [ ] `docs/audit/gap2/lane-2/admin-lesson-bulk-controller.md` (P0:0 P1:22 P2:31 P3:1 open:54)
- [ ] `docs/audit/gap2/lane-2/assignment-controller.md` (P0:0 P1:19 P2:42 P3:1 open:62)
- [ ] `docs/audit/gap2/lane-2/admin-course-bulk-controller.md` (P0:0 P1:21 P2:19 P3:3 open:43)
- [ ] `docs/audit/gap2/lane-2/admin-project-controller.md` (P0:0 P1:16 P2:33 P3:2 open:51)
- [ ] `docs/audit/gap2/lane-2/admin-course-progress-controller.md` (P0:0 P1:14 P2:47 P3:4 open:65)
- [ ] `docs/audit/gap2/lane-2/admin-sms-log-controller.md` (P0:0 P1:16 P2:20 P3:1 open:37)
- [ ] `docs/audit/gap2/lane-2/cross-02-authorization-roles.md` (P0:0 P1:15 P2:24 P3:2 open:41)
- [ ] `docs/audit/gap2/lane-2/admin-recycle-bin-controller.md` (P0:0 P1:13 P2:27 P3:3 open:43)
- [ ] `docs/audit/gap2/lane-2/client-error-report-controller.md` (P0:0 P1:13 P2:19 P3:4 open:36)
- [ ] `docs/audit/gap2/lane-2/attendance-bulk-controller.md` (P0:0 P1:11 P2:38 P3:8 open:57)
- [ ] `docs/audit/gap2/lane-2/l18-u026-new-program-controller.md` (P0:0 P1:13 P2:18 P3:1 open:32)
- [ ] `docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md` (P0:0 P1:10 P2:36 P3:7 open:53)
- [ ] `docs/audit/gap2/lane-2/choices-controller.md` (P0:0 P1:10 P2:35 P3:3 open:48)
- [ ] `docs/audit/gap2/lane-2/classroom-controller.md` (P0:0 P1:10 P2:28 P3:13 open:51)
- [ ] `docs/audit/gap2/lane-2/admin-class-schedule-controller.md` (P0:0 P1:9 P2:27 P3:9 open:45)
- [ ] `docs/audit/gap2/lane-2/batch-controller.md` (P0:0 P1:7 P2:45 P3:12 open:64)
- [ ] `docs/audit/gap2/lane-2/admin-project-template-controller.md` (P0:0 P1:9 P2:24 P3:4 open:37)
- [ ] `docs/audit/gap2/lane-2/class-schedule-controller.md` (P0:0 P1:6 P2:54 P3:9 open:69)
- [ ] `docs/audit/gap2/lane-2/l15-u020-college-branding.md` (P0:0 P1:8 P2:34 P3:10 open:52)
- [ ] `docs/audit/gap2/lane-2/l15-u030-hiring-dashboard.md` (P0:0 P1:8 P2:33 P3:13 open:54)
- [ ] `docs/audit/gap2/lane-2/l19-u022-tpo-hub-controller.md` (P0:0 P1:8 P2:30 P3:0 open:38)
