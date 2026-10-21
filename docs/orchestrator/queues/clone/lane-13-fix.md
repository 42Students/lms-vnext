# Gap FIX queue: lane chat-13

34 audit documents, 1356 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-13.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-13-b with [chat-13] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-13/l17-u023-learneroffer.md` (P0:0 P1:28 P2:24 P3:0 open:52)
- [ ] `docs/audit/gap2/lane-13/recruiter-home.md` (P0:0 P1:20 P2:38 P3:1 open:59)
- [ ] `docs/audit/gap2/lane-13/l19-u029-readiness-gate.md` (P0:0 P1:19 P2:29 P3:0 open:48)
- [ ] `docs/audit/gap2/lane-13/job-offer.md` (P0:0 P1:20 P2:13 P3:0 open:33)
- [ ] `docs/audit/gap2/lane-13/college-admin-students.md` (P0:0 P1:17 P2:40 P3:0 open:57)
- [ ] `docs/audit/gap2/lane-13/dns-mail-domain-resolver.md` (P0:0 P1:19 P2:14 P3:1 open:34)
- [ ] `docs/audit/gap2/lane-13/job-application-status-validator.md` (P0:0 P1:18 P2:21 P3:0 open:39)
- [ ] `docs/audit/gap2/lane-13/job-application-search-cache.md` (P0:0 P1:19 P2:10 P3:5 open:34)
- [ ] `docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md` (P0:0 P1:17 P2:26 P3:1 open:44)
- [ ] `docs/audit/gap2/lane-13/recruiter-company.md` (P0:0 P1:15 P2:44 P3:0 open:59)
- [ ] `docs/audit/gap2/lane-13/l18-u026-new-program-controller.md` (P0:0 P1:16 P2:20 P3:0 open:36)
- [ ] `docs/audit/gap2/lane-13/learner-announcements.md` (P0:0 P1:14 P2:40 P3:0 open:54)
- [ ] `docs/audit/gap2/lane-13/project-task.md` (P0:0 P1:16 P2:14 P3:0 open:30)
- [ ] `docs/audit/gap2/lane-13/l18-u019-faculty-verification.md` (P0:0 P1:16 P2:13 P3:0 open:29)
- [ ] `docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md` (P0:0 P1:14 P2:33 P3:1 open:48)
- [ ] `docs/audit/gap2/lane-9/superadmin-batches-component.md` (P0:0 P1:11 P2:39 P3:2 open:52)
- [ ] `docs/audit/gap2/lane-13/lesson-search-controller.md` (P0:0 P1:13 P2:15 P3:3 open:31)
- [ ] `docs/audit/gap2/lane-13/l17-u028-workspace-readiness.md` (P0:0 P1:12 P2:21 P3:0 open:33)
- [ ] `docs/audit/gap2/lane-5/u011-teacher-calendar.md` (P0:0 P1:9 P2:42 P3:0 open:51)
- [ ] `docs/audit/gap2/lane-13/zeptomail-service.md` (P0:0 P1:12 P2:5 P3:2 open:19)
- [ ] `docs/audit/gap2/lane-10/l13-u026-program-structure-controller.md` (P0:0 P1:11 P2:15 P3:6 open:32)
- [ ] `docs/audit/gap2/lane-13/course-submissions-modal.md` (P0:0 P1:8 P2:43 P3:0 open:51)
- [ ] `docs/audit/gap2/lane-13/l18-u030-superadmin-departments.md` (P0:0 P1:8 P2:34 P3:1 open:43)
- [ ] `docs/audit/gap2/lane-13/new-program.md` (P0:0 P1:9 P2:21 P3:4 open:34)
- [ ] `docs/audit/gap2/lane-10/superadmin-audit.md` (P0:0 P1:7 P2:38 P3:5 open:50)
- [ ] `docs/audit/gap2/lane-13/recruiter-messages.md` (P0:0 P1:6 P2:43 P3:0 open:49)
- [ ] `docs/audit/gap2/lane-5/u021-batch.md` (P0:0 P1:7 P2:25 P3:1 open:33)
- [ ] `docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md` (P0:0 P1:4 P2:53 P3:2 open:59)
- [ ] `docs/audit/gap2/lane-13/role.md` (P0:0 P1:7 P2:10 P3:3 open:20)
- [ ] `docs/audit/gap2/lane-13/course-attendance.md` (P0:0 P1:4 P2:36 P3:1 open:41)
- [ ] `docs/audit/gap2/lane-3/bug-report-activity.md` (P0:0 P1:5 P2:23 P3:0 open:28)
- [ ] `docs/audit/gap2/lane-13/learner-offers.md` (P0:0 P1:2 P2:39 P3:0 open:41)
- [ ] `docs/audit/gap2/lane-8/learner-all-quizzes.md` (P0:0 P1:2 P2:21 P3:0 open:23)
- [ ] `docs/audit/gap2/lane-8/job-round.md` (P0:0 P1:1 P2:8 P3:1 open:10)
