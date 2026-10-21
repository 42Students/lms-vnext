# Gap audit v2 EXTRA queue: lane chat-6

The audit now runs on 10 lanes. These 23 units were reassigned to you from retired lanes 11-20. Same job as your main queue (docs/orchestrator/queues/clone/lane-6-gap.md): AUDIT ONLY, no code changes, same 14+ mandatory facets F01-F23 and same facet table, same verdicts and severities, same rules (read the whole legacy closure, one row per distinct difference, UNKNOWN when it cannot be determined).

Differences: each item is tagged L<origin lane>-U<unit>. Write docs/audit/gap2/lane-6/l<origin lane>-u<unit>-<slug>.md. Row IDs are G2-<origin lane>-<unit number>-<row number>. Tick items in THIS file (lane-6-gap-extra.md) and push to chatgpt/chat-6-b with [chat-6] after every 2 units. If an audit doc for the unit already exists on main under docs/audit/gap2/lane-<origin lane>/, read it, extend it only if thin, and tick the item.

Order of work: finish the unit you are on in your main queue, then continue the main queue to the end, then do this extra queue top to bottom. Strictly one unit at a time.

- [x] L11-U008 (FE page) `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js`
- [x] L11-U009 (FE page) `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js`
- [x] L11-U010 (FE page) `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js`
- [x] L11-U011 (FE page) `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId]/edit.js`
- [x] L11-U012 (FE page) `docs/legacy-source/frontend/src/pages/tpo/drives/index.js`
- [x] L11-U014 (FE page) `docs/legacy-source/frontend/src/pages/tpo/home.js`
- [x] L11-U017 (FE page) `docs/legacy-source/frontend/src/pages/tpo/more.js`
- [x] L11-U020 (FE page) `docs/legacy-source/frontend/src/pages/tpo/recruiters/index.js`
- [x] L11-U023 (FE page) `docs/legacy-source/frontend/src/pages/tpo/requests.js`
- [x] L11-U026 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java`
- [x] L11-U029 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/sprints.js`
- [x] L12-U011 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterNotificationService.java`
- [x] L12-U019 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java`
- [x] L12-U026 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java`
- [x] L13-U022 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRequestController.java`
- [x] L14-U019 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java`
- [x] L14-U029 (FE page) `docs/legacy-source/frontend/src/pages/tpo/batches/[batchId].js`
- [x] L15-U024 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminE2eController.java`
- [x] L17-U020 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassroomMessage.java`
- [x] L17-U030 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js`
- [ ] L18-U020 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java`
- [ ] L18-U030 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js`
- [ ] L19-U026 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java`
