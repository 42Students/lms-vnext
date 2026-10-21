# Gap FIX queue: lane chat-19

34 audit documents, 1321 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-19.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-19-b with [chat-19] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-19/lesson-content.md` (P0:0 P1:42 P2:36 P3:3 open:81)
- [ ] `docs/audit/gap2/lane-19/superadmin-students.md` (P0:0 P1:29 P2:43 P3:4 open:76)
- [ ] `docs/audit/gap2/lane-19/college-admin-course-detail.md` (P0:0 P1:24 P2:36 P3:3 open:63)
- [ ] `docs/audit/gap2/lane-19/learner-placement-schedule.md` (P0:0 P1:21 P2:37 P3:6 open:64)
- [ ] `docs/audit/gap2/lane-19/course-progress.md` (P0:0 P1:21 P2:34 P3:4 open:59)
- [ ] `docs/audit/gap2/lane-19/faculty-teaching-assignment-entity.md` (P0:0 P1:20 P2:28 P3:9 open:57)
- [ ] `docs/audit/gap2/lane-19/learner-calendar-redirect.md` (P0:0 P1:18 P2:32 P3:3 open:53)
- [ ] `docs/audit/gap2/lane-19/job-auto-expiry-service.md` (P0:0 P1:19 P2:12 P3:2 open:33)
- [ ] `docs/audit/gap2/lane-19/bug-tracker-access-entity.md` (P0:0 P1:18 P2:16 P3:4 open:38)
- [ ] `docs/audit/gap2/lane-7/u007-college-admin-workspace-audit.md` (P0:0 P1:16 P2:23 P3:4 open:43)
- [ ] `docs/audit/gap2/lane-7/l15-u025-recruiter-college-controller.md` (P0:0 P1:16 P2:17 P3:1 open:34)
- [ ] `docs/audit/gap2/lane-19/project-meeting-history-entity.md` (P0:0 P1:16 P2:15 P3:2 open:33)
- [ ] `docs/audit/gap2/lane-19/lecture-hall-entity.md` (P0:0 P1:15 P2:23 P3:8 open:46)
- [ ] `docs/audit/gap2/lane-19/apply-to-job-request.md` (P0:0 P1:15 P2:17 P3:7 open:39)
- [ ] `docs/audit/gap2/lane-19/sms-delivery-log-repository.md` (P0:0 P1:14 P2:11 P3:1 open:26)
- [ ] `docs/audit/gap2/lane-7/l12-u020-company-domain.md` (P0:0 P1:13 P2:17 P3:2 open:32)
- [ ] `docs/audit/gap2/lane-19/learner-attendance.md` (P0:0 P1:10 P2:36 P3:3 open:49)
- [ ] `docs/audit/gap2/lane-7/l14-u020-college-company.md` (P0:0 P1:12 P2:16 P3:0 open:28)
- [ ] `docs/audit/gap2/lane-7/u005-college-admin-project-template-detail.md` (P0:0 P1:10 P2:27 P3:5 open:42)
- [ ] `docs/audit/gap2/lane-19/tenant-domain-entity.md` (P0:0 P1:11 P2:16 P3:1 open:28)
- [ ] `docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md` (P0:0 P1:10 P2:17 P3:2 open:29)
- [ ] `docs/audit/gap2/lane-19/quiz-answer-entity.md` (P0:0 P1:10 P2:9 P3:2 open:21)
- [ ] `docs/audit/gap2/lane-2/l18-u016-quiz-attempt.md` (P0:0 P1:9 P2:15 P3:0 open:24)
- [ ] `docs/audit/gap2/lane-19/tpo-email-campaign-service.md` (P0:0 P1:8 P2:22 P3:5 open:35)
- [ ] `docs/audit/gap2/lane-19/attendance-present-absent-button.md` (P0:0 P1:8 P2:20 P3:2 open:30)
- [ ] `docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md` (P0:0 P1:6 P2:40 P3:1 open:47)
- [ ] `docs/audit/gap2/lane-19/faculty-search-controller.md` (P0:0 P1:6 P2:28 P3:5 open:39)
- [ ] `docs/audit/gap2/lane-2/admin-attendance-controller.md` (P0:0 P1:6 P2:26 P3:11 open:43)
- [ ] `docs/audit/gap2/lane-5/l18-u019-faculty-verification.md` (P0:0 P1:8 P2:5 P3:0 open:13)
- [ ] `docs/audit/gap2/lane-7/u008-college-admin-workspace-delivery.md` (P0:0 P1:6 P2:24 P3:7 open:37)
- [ ] `docs/audit/gap2/lane-19/pdf-viewer-modal.md` (P0:0 P1:6 P2:17 P3:8 open:31)
- [ ] `docs/audit/gap2/lane-19/learner-saved-job-service.md` (P0:0 P1:2 P2:12 P3:7 open:21)
- [ ] `docs/audit/gap2/lane-6/course-home-edit-drawer.md` (P0:0 P1:1 P2:14 P3:1 open:16)
- [ ] `docs/audit/gap2/lane-6/base-model.md` (P0:0 P1:1 P2:10 P3:0 open:11)
