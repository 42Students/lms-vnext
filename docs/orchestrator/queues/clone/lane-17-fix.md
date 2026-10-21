# Gap FIX queue: lane chat-17

41 audit documents, 1338 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-17.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-17-b with [chat-17] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-17/legacy-resource-viewer.md` (P0:3 P1:19 P2:29 P3:8 open:59)
- [ ] `docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md` (P0:0 P1:25 P2:39 P3:7 open:71)
- [ ] `docs/audit/gap2/lane-17/placement-job-service.md` (P0:0 P1:21 P2:13 P3:0 open:34)
- [ ] `docs/audit/gap2/lane-17/tpo-scheduled-jobs.md` (P0:0 P1:21 P2:9 P3:1 open:31)
- [ ] `docs/audit/gap2/lane-17/college-admin-lessons.md` (P0:0 P1:15 P2:41 P3:6 open:62)
- [ ] `docs/audit/gap2/lane-7/u036-cross-exports-imports.md` (P0:0 P1:15 P2:34 P3:1 open:50)
- [ ] `docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md` (P0:0 P1:16 P2:22 P3:1 open:39)
- [ ] `docs/audit/gap2/lane-10/superadmin-dashboard.md` (P0:0 P1:12 P2:34 P3:2 open:48)
- [ ] `docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md` (P0:0 P1:11 P2:16 P3:7 open:34)
- [ ] `docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md` (P0:0 P1:8 P2:42 P3:2 open:52)
- [ ] `docs/audit/gap2/lane-17/learner-placements-interviews.md` (P0:0 P1:9 P2:23 P3:0 open:32)
- [ ] `docs/audit/gap2/lane-17/grade-audit-log-entity.md` (P0:0 P1:9 P2:11 P3:0 open:20)
- [ ] `docs/audit/gap2/lane-2/admin-assignment-publish-controller.md` (P0:0 P1:8 P2:19 P3:6 open:33)
- [ ] `docs/audit/gap2/lane-7/u026-mentor-notifications.md` (P0:0 P1:6 P2:38 P3:1 open:45)
- [ ] `docs/audit/gap2/lane-3/project-delivery-event.md` (P0:0 P1:7 P2:28 P3:0 open:35)
- [ ] `docs/audit/gap2/lane-10/platform.md` (P0:0 P1:7 P2:27 P3:2 open:36)
- [ ] `docs/audit/gap2/lane-5/l12-u025-recruiter-plan-drive-controller.md` (P0:0 P1:7 P2:27 P3:0 open:34)
- [ ] `docs/audit/gap2/lane-17/job-search-controller.md` (P0:0 P1:7 P2:21 P3:5 open:33)
- [ ] `docs/audit/gap2/lane-17/learner-courses-courseid-catchall.md` (P0:0 P1:7 P2:17 P3:2 open:26)
- [ ] `docs/audit/gap2/lane-17/classroom-message-entity.md` (P0:0 P1:7 P2:10 P3:2 open:19)
- [ ] `docs/audit/gap2/lane-5/l18-u029-semester-management.md` (P0:0 P1:4 P2:31 P3:2 open:37)
- [ ] `docs/audit/gap2/lane-17/learner-project-detail.md` (P0:0 P1:6 P2:8 P3:0 open:14)
- [ ] `docs/audit/gap2/lane-17/project-release-entity.md` (P0:0 P1:5 P2:18 P3:3 open:26)
- [ ] `docs/audit/gap2/lane-10/cross-10-list-conventions.md` (P0:0 P1:3 P2:34 P3:5 open:42)
- [ ] `docs/audit/gap2/lane-17/email-suppression-entity.md` (P0:0 P1:5 P2:10 P3:1 open:16)
- [ ] `docs/audit/gap2/lane-9/superadmin-departments.md` (P0:0 P1:3 P2:30 P3:5 open:38)
- [ ] `docs/audit/gap2/lane-17/lesson-content-class-sequence-entity.md` (P0:0 P1:5 P2:8 P3:1 open:14)
- [ ] `docs/audit/gap2/lane-3/superadmin-organizations.md` (P0:0 P1:1 P2:47 P3:8 open:56)
- [ ] `docs/audit/gap2/lane-9/college-admin-dashboard.md` (P0:0 P1:2 P2:36 P3:0 open:38)
- [ ] `docs/audit/gap2/lane-10/l15-u018-log-alert-signature.md` (P0:0 P1:5 P2:5 P3:1 open:11)
- [ ] `docs/audit/gap2/lane-5/u004-mentor-calendar.md` (P0:0 P1:4 P2:13 P3:7 open:24)
- [ ] `docs/audit/gap2/lane-10/l12-u029-superadmin-project-template-resources.md` (P0:0 P1:2 P2:31 P3:9 open:42)
- [ ] `docs/audit/gap2/lane-17/tpo-placements-page-controller.md` (P0:0 P1:3 P2:17 P3:7 open:27)
- [ ] `docs/audit/gap2/lane-9/l14-u022-tpo-recruiter-lead-controller.md` (P0:0 P1:3 P2:16 P3:1 open:20)
- [ ] `docs/audit/gap2/lane-3/mobile-responsive-contract.md` (P0:0 P1:0 P2:42 P3:5 open:47)
- [ ] `docs/audit/gap2/lane-17/job-eligibility-override-repository.md` (P0:0 P1:3 P2:9 P3:2 open:14)
- [ ] `docs/audit/gap2/lane-17/public-job-response-dto.md` (P0:0 P1:2 P2:10 P3:2 open:14)
- [ ] `docs/audit/gap2/lane-17/quiz-option-entity.md` (P0:0 P1:1 P2:12 P3:4 open:17)
- [ ] `docs/audit/gap2/lane-17/learner-saved-jobs-service.md` (P0:0 P1:0 P2:15 P3:7 open:22)
- [ ] `docs/audit/gap2/lane-10/l17-u024-superadmin-bug-tracker-controller.md` (P0:0 P1:0 P2:10 P3:4 open:14)
- [ ] `docs/audit/gap2/lane-17/attendance-name-with-dp.md` (P0:0 P1:0 P2:9 P3:3 open:12)
