# Gap audit v2 EXTRA queue: lane chat-4

The audit now runs on 10 lanes. These 12 units were reassigned to you from retired lanes 11-20. Same job as your main queue (docs/orchestrator/queues/clone/lane-4-gap.md): AUDIT ONLY, no code changes, same 14+ mandatory facets F01-F23 and same facet table, same verdicts and severities, same rules (read the whole legacy closure, one row per distinct difference, UNKNOWN when it cannot be determined).

Differences: each item is tagged L<origin lane>-U<unit>. Write docs/audit/gap2/lane-4/l<origin lane>-u<unit>-<slug>.md. Row IDs are G2-<origin lane>-<unit number>-<row number>. Tick items in THIS file (lane-4-gap-extra.md) and push to chatgpt/chat-4-b with [chat-4] after every 2 units. If an audit doc for the unit already exists on main under docs/audit/gap2/lane-<origin lane>/, read it, extend it only if thin, and tick the item.

Order of work: finish the unit you are on in your main queue, then continue the main queue to the end, then do this extra queue top to bottom. Strictly one unit at a time.

- [x] L12-U010 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java`
- [x] L12-U015 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRoleOption.java`
- [x] L12-U024 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java`
- [ ] L13-U020 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java`
- [ ] L13-U030 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js`
- [ ] L14-U027 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java`
- [ ] L15-U022 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java`
- [ ] L16-U031 (Cross-cutting area) `cross/16: Placements end to end: companies, drives, jobs, applications, rounds, offers, joining, verification, eligibility`
- [ ] L17-U028 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/readiness.js`
- [ ] L18-U018 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java`
- [ ] L18-U028 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/overview.js`
- [ ] L19-U024 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAnnouncementController.java`
