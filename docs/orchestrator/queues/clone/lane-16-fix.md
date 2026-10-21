# Gap FIX queue: lane chat-16

35 audit documents, 1345 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-16.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-16-b with [chat-16] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md` (P0:3 P1:17 P2:14 P3:6 open:40)
- [ ] `docs/audit/gap2/lane-16/u011-notification-scheduler.md` (P0:2 P1:31 P2:10 P3:1 open:44)
- [ ] `docs/audit/gap2/lane-16/u012-scheduler-lock-service.md` (P0:2 P1:7 P2:5 P3:5 open:19)
- [ ] `docs/audit/gap2/lane-16/u001-tracker-audit-findings.md` (P0:1 P1:24 P2:31 P3:8 open:64)
- [ ] `docs/audit/gap2/lane-16/u005-tracker-logs.md` (P0:0 P1:32 P2:37 P3:11 open:80)
- [ ] `docs/audit/gap2/lane-16/u002-tracker-report.md` (P0:0 P1:23 P2:34 P3:8 open:65)
- [ ] `docs/audit/gap2/lane-16/u010-skills-search-controller.md` (P0:0 P1:16 P2:22 P3:9 open:47)
- [ ] `docs/audit/gap2/lane-16/u031-placements-end-to-end.md` (P0:0 P1:14 P2:32 P3:8 open:54)
- [ ] `docs/audit/gap2/lane-16/u007-college-semester-courses.md` (P0:0 P1:13 P2:37 P3:19 open:69)
- [ ] `docs/audit/gap2/lane-9/superadmin-audit-logs.md` (P0:0 P1:13 P2:33 P3:0 open:46)
- [ ] `docs/audit/gap2/lane-16/u003-tracker-issue-detail.md` (P0:0 P1:12 P2:38 P3:17 open:67)
- [ ] `docs/audit/gap2/lane-10/superadmin-verification.md` (P0:0 P1:10 P2:51 P3:8 open:69)
- [ ] `docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md` (P0:0 P1:12 P2:26 P3:6 open:44)
- [ ] `docs/audit/gap2/lane-16/u023-learner-placement-controller.md` (P0:0 P1:12 P2:18 P3:3 open:33)
- [ ] `docs/audit/gap2/lane-16/u008-learner-syllabus.md` (P0:0 P1:9 P2:38 P3:11 open:58)
- [ ] `docs/audit/gap2/lane-4/elective-admin-controller.md` (P0:0 P1:10 P2:26 P3:0 open:36)
- [ ] `docs/audit/gap2/lane-4/job-preferences-repository.md` (P0:0 P1:10 P2:25 P3:1 open:36)
- [ ] `docs/audit/gap2/lane-16/u024-super-admin-company-controller.md` (P0:0 P1:11 P2:12 P3:6 open:29)
- [ ] `docs/audit/gap2/lane-16/u022-tpo-public-link.md` (P0:0 P1:11 P2:9 P3:3 open:23)
- [ ] `docs/audit/gap2/lane-16/u027-faculty-class-schedule-controller.md` (P0:0 P1:10 P2:16 P3:4 open:30)
- [ ] `docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md` (P0:0 P1:9 P2:18 P3:1 open:28)
- [ ] `docs/audit/gap2/lane-16/u019-image-entry.md` (P0:0 P1:9 P2:11 P3:3 open:23)
- [ ] `docs/audit/gap2/lane-2/admin-college-summary-controller.md` (P0:0 P1:8 P2:17 P3:7 open:32)
- [ ] `docs/audit/gap2/lane-16/u015-job-eligibility.md` (P0:0 P1:8 P2:12 P3:2 open:22)
- [ ] `docs/audit/gap2/lane-16/u013-job-search-dto.md` (P0:0 P1:7 P2:20 P3:7 open:34)
- [ ] `docs/audit/gap2/lane-16/u021-admin-audit-log.md` (P0:0 P1:7 P2:11 P3:2 open:20)
- [ ] `docs/audit/gap2/lane-5/u018-project-activity-event.md` (P0:0 P1:6 P2:19 P3:1 open:26)
- [ ] `docs/audit/gap2/lane-16/u006-learner-course-redirect.md` (P0:0 P1:6 P2:12 P3:3 open:21)
- [ ] `docs/audit/gap2/lane-16/u020-college.md` (P0:0 P1:6 P2:9 P3:3 open:18)
- [ ] `docs/audit/gap2/lane-16/u009-learner-attendance.md` (P0:0 P1:4 P2:24 P3:12 open:40)
- [ ] `docs/audit/gap2/lane-2/admin-quiz-controller.md` (P0:0 P1:2 P2:24 P3:5 open:31)
- [ ] `docs/audit/gap2/lane-6/cross-06-files-uploads-media-storage.md` (P0:0 P1:2 P2:23 P3:1 open:26)
- [ ] `docs/audit/gap2/lane-16/u016-quiz-question.md` (P0:0 P1:3 P2:9 P3:0 open:12)
- [ ] `docs/audit/gap2/lane-16/u026-organization-controller.md` (P0:0 P1:0 P2:13 P3:7 open:20)
- [ ] `docs/audit/gap2/lane-4/api-ai-grading-grade-booklet.md` (P0:0 P1:0 P2:0 P3:39 open:39)
