# Gap FIX queue: lane chat-14

37 audit documents, 1357 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-14.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-14-b with [chat-14] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-14/l19-u026-module-access-controller.md` (P0:5 P1:10 P2:12 P3:0 open:27)
- [ ] `docs/audit/gap2/lane-14/u012-zeptomail-service.md` (P0:2 P1:12 P2:16 P3:0 open:30)
- [ ] `docs/audit/gap2/lane-14/u011-placement-job-service-impl.md` (P0:0 P1:30 P2:33 P3:0 open:63)
- [ ] `docs/audit/gap2/lane-14/super-admin-students.md` (P0:0 P1:23 P2:49 P3:0 open:72)
- [ ] `docs/audit/gap2/lane-14/u019-interview.md` (P0:0 P1:23 P2:26 P3:0 open:49)
- [ ] `docs/audit/gap2/lane-14/u020-college-company.md` (P0:0 P1:23 P2:21 P3:0 open:44)
- [ ] `docs/audit/gap2/lane-14/u009-teacher-attendance-view.md` (P0:0 P1:16 P2:39 P3:4 open:59)
- [ ] `docs/audit/gap2/lane-14/u016-recruiter-college-access.md` (P0:0 P1:17 P2:25 P3:0 open:42)
- [ ] `docs/audit/gap2/lane-14/learner-placement-jobs.md` (P0:0 P1:15 P2:44 P3:1 open:60)
- [ ] `docs/audit/gap2/lane-14/u017-project-sprint.md` (P0:0 P1:17 P2:17 P3:0 open:34)
- [ ] `docs/audit/gap2/lane-14/course-progress.md` (P0:0 P1:14 P2:45 P3:2 open:61)
- [ ] `docs/audit/gap2/lane-14/l18-u018-lesson.md` (P0:0 P1:17 P2:9 P3:0 open:26)
- [ ] `docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md` (P0:0 P1:14 P2:33 P3:2 open:49)
- [ ] `docs/audit/gap2/lane-14/l18-u021-job-important-date-event-dto.md` (P0:0 P1:15 P2:14 P3:0 open:29)
- [ ] `docs/audit/gap2/lane-14/u015-job-lifecycle-status.md` (P0:0 P1:15 P2:12 P3:0 open:27)
- [ ] `docs/audit/gap2/lane-14/u021-app-setting.md` (P0:0 P1:14 P2:19 P3:0 open:33)
- [ ] `docs/audit/gap2/lane-9/superadmin-batches.md` (P0:0 P1:11 P2:39 P3:2 open:52)
- [ ] `docs/audit/gap2/lane-7/l13-u023-learner-schedule-controller.md` (P0:0 P1:12 P2:14 P3:1 open:27)
- [ ] `docs/audit/gap2/lane-9/superadmin-batch-promotion.md` (P0:0 P1:8 P2:37 P3:3 open:48)
- [ ] `docs/audit/gap2/lane-14/u014-announcement-search-controller.md` (P0:0 P1:9 P2:22 P3:3 open:34)
- [ ] `docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md` (P0:0 P1:6 P2:48 P3:6 open:60)
- [ ] `docs/audit/gap2/lane-14/u010-job-application-source-validator.md` (P0:0 P1:10 P2:7 P3:1 open:18)
- [ ] `docs/audit/gap2/lane-10/l19-u020-bug-tracker-access.md` (P0:0 P1:9 P2:13 P3:0 open:22)
- [ ] `docs/audit/gap2/lane-14/u013-lecture-hall-search-controller.md` (P0:0 P1:7 P2:31 P3:6 open:44)
- [ ] `docs/audit/gap2/lane-14/syllabus-video.md` (P0:0 P1:5 P2:41 P3:2 open:48)
- [ ] `docs/audit/gap2/lane-14/tpo-students.md` (P0:0 P1:4 P2:45 P3:0 open:49)
- [ ] `docs/audit/gap2/lane-2/class-controller.md` (P0:0 P1:5 P2:34 P3:10 open:49)
- [ ] `docs/audit/gap2/lane-14/college-hidden-student-group.md` (P0:0 P1:7 P2:9 P3:1 open:17)
- [ ] `docs/audit/gap2/lane-4/bug-report-model.md` (P0:0 P1:5 P2:26 P3:0 open:31)
- [ ] `docs/audit/gap2/lane-14/l18-u029-semester-management.md` (P0:0 P1:6 P2:8 P3:0 open:14)
- [ ] `docs/audit/gap2/lane-14/u018-log-alert-state.md` (P0:0 P1:6 P2:7 P3:0 open:13)
- [ ] `docs/audit/gap2/lane-14/u022-tpo-recruiter-lead-controller.md` (P0:0 P1:4 P2:25 P3:1 open:30)
- [ ] `docs/audit/gap2/lane-6/l12-u026-project-workspace-controller.md` (P0:0 P1:3 P2:14 P3:0 open:17)
- [ ] `docs/audit/gap2/lane-6/telegram-webhook-controller.md` (P0:0 P1:3 P2:14 P3:3 open:20)
- [ ] `docs/audit/gap2/lane-14/l19-u022-tpo-hub-controller.md` (P0:0 P1:2 P2:3 P3:0 open:5)
- [ ] `docs/audit/gap2/lane-14/learner-root-redirect.md` (P0:0 P1:0 P2:2 P3:0 open:2)
- [ ] `docs/audit/gap2/lane-4/ai-grading.md` (P0:0 P1:0 P2:0 P3:52 open:52)
