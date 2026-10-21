# Gap FIX queue: lane chat-20

46 audit documents, 1329 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-20.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-20-b with [chat-20] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-20/teacher-profile.md` (P0:0 P1:24 P2:49 P3:4 open:77)
- [ ] `docs/audit/gap2/lane-7/l17-u021-public-job-response-dto.md` (P0:0 P1:14 P2:15 P3:0 open:29)
- [ ] `docs/audit/gap2/lane-20/recruiter-message-email-service.md` (P0:0 P1:12 P2:26 P3:3 open:41)
- [ ] `docs/audit/gap2/lane-20/shared-public-pages.md` (P0:0 P1:9 P2:43 P3:10 open:62)
- [ ] `docs/audit/gap2/lane-20/superadmin-sections-programs.md` (P0:0 P1:8 P2:36 P3:10 open:54)
- [ ] `docs/audit/gap2/lane-10/l18-u014-email-suppression-repository.md` (P0:0 P1:10 P2:10 P3:0 open:20)
- [ ] `docs/audit/gap2/lane-9/college-admin-semesters.md` (P0:0 P1:7 P2:38 P3:5 open:50)
- [ ] `docs/audit/gap2/lane-4/college-signin-methods.md` (P0:0 P1:7 P2:37 P3:8 open:52)
- [ ] `docs/audit/gap2/lane-2/admin-assignment-controller.md` (P0:0 P1:7 P2:35 P3:8 open:50)
- [ ] `docs/audit/gap2/lane-3/l12-u014-job-application-search-controller.md` (P0:0 P1:6 P2:42 P3:8 open:56)
- [ ] `docs/audit/gap2/lane-2/zeptomail-template-id-resolver.md` (P0:0 P1:9 P2:12 P3:2 open:23)
- [ ] `docs/audit/gap2/lane-20/r2-storage-utils.md` (P0:0 P1:7 P2:23 P3:6 open:36)
- [ ] `docs/audit/gap2/lane-20/enterprises.md` (P0:0 P1:5 P2:37 P3:11 open:53)
- [ ] `docs/audit/gap2/lane-5/l19-u025-public-tenant-controller.md` (P0:0 P1:6 P2:27 P3:0 open:33)
- [ ] `docs/audit/gap2/lane-20/job-service.md` (P0:0 P1:7 P2:16 P3:2 open:25)
- [ ] `docs/audit/gap2/lane-9/superadmin-college-subdomain.md` (P0:0 P1:5 P2:34 P3:4 open:43)
- [ ] `docs/audit/gap2/lane-20/universities.md` (P0:0 P1:4 P2:39 P3:9 open:52)
- [ ] `docs/audit/gap2/lane-20/project-meeting.md` (P0:0 P1:5 P2:25 P3:6 open:36)
- [ ] `docs/audit/gap2/lane-20/student-image.md` (P0:0 P1:5 P2:20 P3:0 open:25)
- [ ] `docs/audit/gap2/lane-20/learner-verification.md` (P0:0 P1:5 P2:16 P3:3 open:24)
- [ ] `docs/audit/gap2/lane-20/student-image-controller.md` (P0:0 P1:5 P2:13 P3:1 open:19)
- [ ] `docs/audit/gap2/lane-5/l15-u023-learner-registration-controller.md` (P0:0 P1:5 P2:13 P3:0 open:18)
- [ ] `docs/audit/gap2/lane-3/course-student-roster.md` (P0:0 P1:3 P2:32 P3:0 open:35)
- [ ] `docs/audit/gap2/lane-20/home.md` (P0:0 P1:2 P2:38 P3:12 open:52)
- [ ] `docs/audit/gap2/lane-20/job-application-status-history-service-impl.md` (P0:0 P1:4 P2:18 P3:3 open:25)
- [ ] `docs/audit/gap2/lane-5/l12-u016-semester-entity.md` (P0:0 P1:3 P2:17 P3:2 open:22)
- [ ] `docs/audit/gap2/lane-20/404.md` (P0:0 P1:3 P2:16 P3:5 open:24)
- [ ] `docs/audit/gap2/lane-8/shared-course-home.md` (P0:0 P1:2 P2:22 P3:2 open:26)
- [ ] `docs/audit/gap2/lane-20/learner-group-controller.md` (P0:0 P1:3 P2:11 P3:0 open:14)
- [ ] `docs/audit/gap2/lane-20/privacy-policy.md` (P0:0 P1:2 P2:19 P3:7 open:28)
- [ ] `docs/audit/gap2/lane-20/public-share-controller.md` (P0:0 P1:2 P2:12 P3:1 open:15)
- [ ] `docs/audit/gap2/lane-20/tpo-email-campaign-controller.md` (P0:0 P1:1 P2:18 P3:1 open:20)
- [ ] `docs/audit/gap2/lane-20/quiz.md` (P0:0 P1:1 P2:12 P3:2 open:15)
- [ ] `docs/audit/gap2/lane-20/faculty-course-mapping.md` (P0:0 P1:0 P2:18 P3:3 open:21)
- [ ] `docs/audit/gap2/lane-20/learner-saved-job-repository.md` (P0:0 P1:1 P2:8 P3:7 open:16)
- [ ] `docs/audit/gap2/lane-8/job-application-search-dto.md` (P0:0 P1:0 P2:17 P3:4 open:21)
- [ ] `docs/audit/gap2/lane-20/department-search-controller.md` (P0:0 P1:0 P2:15 P3:11 open:26)
- [ ] `docs/audit/gap2/lane-20/500.md` (P0:0 P1:0 P2:13 P3:7 open:20)
- [ ] `docs/audit/gap2/lane-20/lesson-controller.md` (P0:0 P1:0 P2:12 P3:3 open:15)
- [ ] `docs/audit/gap2/lane-20/tpo-workspace-controller.md` (P0:0 P1:0 P2:11 P3:1 open:12)
- [ ] `docs/audit/gap2/lane-20/company-controller.md` (P0:0 P1:0 P2:9 P3:2 open:11)
- [ ] `docs/audit/gap2/lane-2/temporary-sms-outage-recovery.md` (P0:0 P1:0 P2:9 P3:5 open:14)
- [ ] `docs/audit/gap2/lane-20/api-hello.md` (P0:0 P1:0 P2:6 P3:1 open:7)
- [ ] `docs/audit/gap2/lane-20/bug-report-attachment.md` (P0:0 P1:0 P2:4 P3:3 open:7)
- [ ] `docs/audit/gap2/lane-2/l12-u031-global-shell.md` (P0:0 P1:0 P2:4 P3:0 open:4)
- [ ] `docs/audit/gap2/lane-8/mentor-courses-redirect.md` (P0:0 P1:0 P2:1 P3:0 open:1)
