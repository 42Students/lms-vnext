# Gap FIX queue: lane chat-3

28 audit documents, 1441 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-3.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-3-b with [chat-3] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-3/job-types.md` (P0:3 P1:10 P2:27 P3:2 open:42)
- [ ] `docs/audit/gap2/lane-3/private-doc-storage.md` (P0:1 P1:10 P2:13 P3:0 open:24)
- [ ] `docs/audit/gap2/lane-3/college-admin-courses.md` (P0:0 P1:26 P2:47 P3:0 open:73)
- [ ] `docs/audit/gap2/lane-3/college-admin-quizzes.md` (P0:0 P1:22 P2:50 P3:2 open:74)
- [ ] `docs/audit/gap2/lane-3/exotel-sms-service-impl.md` (P0:0 P1:16 P2:18 P3:2 open:36)
- [ ] `docs/audit/gap2/lane-3/superadmin-quizzes-section.md` (P0:0 P1:13 P2:42 P3:0 open:55)
- [ ] `docs/audit/gap2/lane-3/public-recruiter-invite-controller.md` (P0:0 P1:13 P2:39 P3:2 open:54)
- [ ] `docs/audit/gap2/lane-3/l13-u019-job-model.md` (P0:0 P1:13 P2:31 P3:1 open:45)
- [ ] `docs/audit/gap2/lane-3/student-course-controller.md` (P0:0 P1:12 P2:39 P3:1 open:52)
- [ ] `docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md` (P0:0 P1:11 P2:46 P3:5 open:62)
- [ ] `docs/audit/gap2/lane-3/lesson-content-controller.md` (P0:0 P1:9 P2:58 P3:3 open:70)
- [ ] `docs/audit/gap2/lane-3/job-repository.md` (P0:0 P1:12 P2:25 P3:0 open:37)
- [ ] `docs/audit/gap2/lane-3/college-controller.md` (P0:0 P1:10 P2:44 P3:10 open:64)
- [ ] `docs/audit/gap2/lane-3/faculty-all-quizzes.md` (P0:0 P1:10 P2:42 P3:0 open:52)
- [ ] `docs/audit/gap2/lane-3/course-search-controller.md` (P0:0 P1:10 P2:36 P3:3 open:49)
- [ ] `docs/audit/gap2/lane-3/l11-u019-tpo-recruiter-lead-detail.md` (P0:0 P1:8 P2:52 P3:6 open:66)
- [ ] `docs/audit/gap2/lane-3/student-assignment.md` (P0:0 P1:10 P2:31 P3:0 open:41)
- [ ] `docs/audit/gap2/lane-3/l11-u013-tpo-drives-new.md` (P0:0 P1:6 P2:68 P3:1 open:75)
- [ ] `docs/audit/gap2/lane-3/l17-u027-discussion-controller.md` (P0:0 P1:10 P2:27 P3:1 open:38)
- [ ] `docs/audit/gap2/lane-3/qualification.md` (P0:0 P1:9 P2:35 P3:0 open:44)
- [ ] `docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md` (P0:0 P1:7 P2:54 P3:3 open:64)
- [ ] `docs/audit/gap2/lane-3/l18-u017-project-member-entity.md` (P0:0 P1:9 P2:29 P3:1 open:39)
- [ ] `docs/audit/gap2/lane-3/learner-quiz.md` (P0:0 P1:8 P2:39 P3:0 open:47)
- [ ] `docs/audit/gap2/lane-3/faculty-quiz-report.md` (P0:0 P1:8 P2:37 P3:0 open:45)
- [ ] `docs/audit/gap2/lane-3/l11-u025-tpo-verification.md` (P0:0 P1:5 P2:62 P3:4 open:71)
- [ ] `docs/audit/gap2/lane-3/superadmin-quizzes.md` (P0:0 P1:8 P2:31 P3:0 open:39)
- [ ] `docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md` (P0:0 P1:7 P2:39 P3:0 open:46)
- [ ] `docs/audit/gap2/lane-3/tpo-drive-controller.md` (P0:0 P1:8 P2:29 P3:0 open:37)
