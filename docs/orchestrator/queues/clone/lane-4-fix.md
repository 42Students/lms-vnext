# Gap FIX queue: lane chat-4

29 audit documents, 1462 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-4.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-4-b with [chat-4] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-4/superadmin-sections-assignments.md` (P0:0 P1:33 P2:64 P3:2 open:99)
- [ ] `docs/audit/gap2/lane-4/college-admin-assignments.md` (P0:0 P1:23 P2:49 P3:0 open:72)
- [ ] `docs/audit/gap2/lane-4/teacher-all-assignments.md` (P0:0 P1:23 P2:49 P3:2 open:74)
- [ ] `docs/audit/gap2/lane-4/college-search-controller.md` (P0:0 P1:22 P2:41 P3:2 open:65)
- [ ] `docs/audit/gap2/lane-4/learner-content-progress-model.md` (P0:0 P1:23 P2:27 P3:1 open:51)
- [ ] `docs/audit/gap2/lane-4/sms-delivery-log.md` (P0:0 P1:22 P2:29 P3:1 open:52)
- [ ] `docs/audit/gap2/lane-4/cross-notifications.md` (P0:0 P1:20 P2:37 P3:0 open:57)
- [ ] `docs/audit/gap2/lane-4/faculty-model.md` (P0:0 P1:21 P2:27 P3:1 open:49)
- [ ] `docs/audit/gap2/lane-4/l13-u030-interview-feedback-form.md` (P0:0 P1:22 P2:16 P3:0 open:38)
- [ ] `docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md` (P0:0 P1:18 P2:45 P3:0 open:63)
- [ ] `docs/audit/gap2/lane-4/project-delivery-model.md` (P0:0 P1:19 P2:33 P3:2 open:54)
- [ ] `docs/audit/gap2/lane-4/l13-u020-company-model.md` (P0:0 P1:20 P2:14 P3:0 open:34)
- [ ] `docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md` (P0:0 P1:17 P2:43 P3:6 open:66)
- [ ] `docs/audit/gap2/lane-4/tpo-team-redirect.md` (P0:0 P1:19 P2:23 P3:2 open:44)
- [ ] `docs/audit/gap2/lane-4/skill-controller.md` (P0:0 P1:17 P2:42 P3:5 open:64)
- [ ] `docs/audit/gap2/lane-4/superadmin-faculty-assignment.md` (P0:0 P1:17 P2:36 P3:0 open:53)
- [ ] `docs/audit/gap2/lane-4/project-workspace-model.md` (P0:0 P1:18 P2:21 P3:2 open:41)
- [ ] `docs/audit/gap2/lane-4/college-admin-faculty-assignment.md` (P0:0 P1:16 P2:32 P3:0 open:48)
- [ ] `docs/audit/gap2/lane-4/l12-u010-job-notification-helper.md` (P0:0 P1:17 P2:15 P3:0 open:32)
- [ ] `docs/audit/gap2/lane-4/superadmin-projects-submissions.md` (P0:0 P1:16 P2:25 P3:0 open:41)
- [ ] `docs/audit/gap2/lane-4/college-admin-projects-submissions.md` (P0:0 P1:14 P2:29 P3:0 open:43)
- [ ] `docs/audit/gap2/lane-4/cross-third-party-integrations.md` (P0:0 P1:15 P2:15 P3:1 open:31)
- [ ] `docs/audit/gap2/lane-4/superadmin-assignments.md` (P0:0 P1:13 P2:33 P3:1 open:47)
- [ ] `docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md` (P0:0 P1:14 P2:21 P3:0 open:35)
- [ ] `docs/audit/gap2/lane-4/public-placements-page-controller.md` (P0:0 P1:11 P2:48 P3:1 open:60)
- [ ] `docs/audit/gap2/lane-4/tpo-company-controller.md` (P0:0 P1:11 P2:33 P3:0 open:44)
- [ ] `docs/audit/gap2/lane-4/lecture-hall-controller.md` (P0:0 P1:10 P2:40 P3:3 open:53)
- [ ] `docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md` (P0:0 P1:12 P2:17 P3:0 open:29)
- [ ] `docs/audit/gap2/lane-4/l12-u015-job-role-option.md` (P0:0 P1:12 P2:11 P3:0 open:23)
