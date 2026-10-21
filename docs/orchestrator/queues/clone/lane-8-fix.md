# Gap FIX queue: lane chat-8

40 audit documents, 1482 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-8.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-8-b with [chat-8] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-8/l18-u022-tpo-offer-controller.md` (P0:2 P1:16 P2:23 P3:0 open:41)
- [ ] `docs/audit/gap2/lane-8/resource-file-controller.md` (P0:2 P1:14 P2:15 P3:1 open:32)
- [ ] `docs/audit/gap2/lane-8/l12-u021-assignment-upload-receipt.md` (P0:2 P1:5 P2:16 P3:0 open:23)
- [ ] `docs/audit/gap2/lane-8/notification.md` (P0:0 P1:30 P2:48 P3:1 open:79)
- [ ] `docs/audit/gap2/lane-8/course.md` (P0:0 P1:32 P2:26 P3:0 open:58)
- [ ] `docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md` (P0:0 P1:26 P2:24 P3:2 open:52)
- [ ] `docs/audit/gap2/lane-8/tpo-season-controller.md` (P0:0 P1:22 P2:17 P3:0 open:39)
- [ ] `docs/audit/gap2/lane-8/super-admin-project-workspace-new.md` (P0:0 P1:19 P2:31 P3:0 open:50)
- [ ] `docs/audit/gap2/lane-8/tpo-applicant-controller.md` (P0:0 P1:19 P2:26 P3:0 open:45)
- [ ] `docs/audit/gap2/lane-8/interview-controller.md` (P0:0 P1:19 P2:22 P3:0 open:41)
- [ ] `docs/audit/gap2/lane-8/super-admin-recruiter-controller.md` (P0:0 P1:18 P2:25 P3:0 open:43)
- [ ] `docs/audit/gap2/lane-8/attend.md` (P0:0 P1:16 P2:28 P3:0 open:44)
- [ ] `docs/audit/gap2/lane-8/job-application-status-history.md` (P0:0 P1:16 P2:24 P3:0 open:40)
- [ ] `docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md` (P0:0 P1:16 P2:22 P3:5 open:43)
- [ ] `docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md` (P0:0 P1:15 P2:25 P3:6 open:46)
- [ ] `docs/audit/gap2/lane-8/project-template.md` (P0:0 P1:13 P2:44 P3:0 open:57)
- [ ] `docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md` (P0:0 P1:13 P2:32 P3:1 open:46)
- [ ] `docs/audit/gap2/lane-8/super-admin-jobs-directory.md` (P0:0 P1:12 P2:35 P3:2 open:49)
- [ ] `docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md` (P0:0 P1:11 P2:43 P3:0 open:54)
- [ ] `docs/audit/gap2/lane-8/l14-u021-app-setting.md` (P0:0 P1:13 P2:17 P3:3 open:33)
- [ ] `docs/audit/gap2/lane-8/l18-u012-notification-service.md` (P0:0 P1:10 P2:28 P3:1 open:39)
- [ ] `docs/audit/gap2/lane-8/super-admin-project-template-versions.md` (P0:0 P1:10 P2:24 P3:0 open:34)
- [ ] `docs/audit/gap2/lane-8/l12-u012-mail-domain-resolver.md` (P0:0 P1:11 P2:8 P3:1 open:20)
- [ ] `docs/audit/gap2/lane-8/l11-u030-superadmin-job-applications.md` (P0:0 P1:9 P2:24 P3:0 open:33)
- [ ] `docs/audit/gap2/lane-8/public-college-join-controller.md` (P0:0 P1:8 P2:26 P3:2 open:36)
- [ ] `docs/audit/gap2/lane-8/l19-u018-lecture-hall.md` (P0:0 P1:7 P2:18 P3:2 open:27)
- [ ] `docs/audit/gap2/lane-8/l11-u024-tpo-settings.md` (P0:0 P1:6 P2:26 P3:1 open:33)
- [ ] `docs/audit/gap2/lane-8/l17-u022-tpo-placements-page-controller.md` (P0:0 P1:6 P2:25 P3:7 open:38)
- [ ] `docs/audit/gap2/lane-8/l11-u027-feature-flags.md` (P0:0 P1:7 P2:10 P3:1 open:18)
- [ ] `docs/audit/gap2/lane-8/admin-job-service.md` (P0:0 P1:5 P2:24 P3:0 open:29)
- [ ] `docs/audit/gap2/lane-8/college-admin-people.md` (P0:0 P1:5 P2:23 P3:3 open:31)
- [ ] `docs/audit/gap2/lane-8/l11-u021-tpo-report-detail.md` (P0:0 P1:5 P2:20 P3:0 open:25)
- [ ] `docs/audit/gap2/lane-8/people-directory-component.md` (P0:0 P1:4 P2:25 P3:1 open:30)
- [ ] `docs/audit/gap2/lane-8/job-slug-generator.md` (P0:0 P1:5 P2:13 P3:0 open:18)
- [ ] `docs/audit/gap2/lane-8/l19-u028-superadmin-workspace-meetings.md` (P0:0 P1:4 P2:23 P3:1 open:28)
- [ ] `docs/audit/gap2/lane-8/semester-course.md` (P0:0 P1:4 P2:18 P3:1 open:23)
- [ ] `docs/audit/gap2/lane-8/job-lifecycle-service.md` (P0:0 P1:4 P2:14 P3:1 open:19)
- [ ] `docs/audit/gap2/lane-8/l11-u018-tpo-notifications.md` (P0:0 P1:3 P2:16 P3:0 open:19)
- [ ] `docs/audit/gap2/lane-8/program-search-controller.md` (P0:0 P1:2 P2:26 P3:0 open:28)
- [ ] `docs/audit/gap2/lane-8/college-course-progress.md` (P0:0 P1:1 P2:35 P3:3 open:39)
