# Gap audit v2 EXTRA queue: lane chat-3

The audit now runs on 10 lanes. These 18 units were reassigned to you from retired lanes 11-20. Same job as your main queue (docs/orchestrator/queues/clone/lane-3-gap.md): AUDIT ONLY, no code changes, same 14+ mandatory facets F01-F23 and same facet table, same verdicts and severities, same rules (read the whole legacy closure, one row per distinct difference, UNKNOWN when it cannot be determined).

Differences: each item is tagged L<origin lane>-U<unit>. Write docs/audit/gap2/lane-3/l<origin lane>-u<unit>-<slug>.md. Row IDs are G2-<origin lane>-<unit number>-<row number>. Tick items in THIS file (lane-3-gap-extra.md) and push to chatgpt/chat-3-b with [chat-3] after every 2 units. If an audit doc for the unit already exists on main under docs/audit/gap2/lane-<origin lane>/, read it, extend it only if thin, and tick the item.

Order of work: finish the unit you are on in your main queue, then continue the main queue to the end, then do this extra queue top to bottom. Strictly one unit at a time.

- [x] L11-U013 (FE page) `docs/legacy-source/frontend/src/pages/tpo/drives/new.js`
- [x] L11-U016 (FE page) `docs/legacy-source/frontend/src/pages/tpo/messages.js`
- [ ] L11-U019 (FE page) `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js`
- [ ] L11-U022 (FE page) `docs/legacy-source/frontend/src/pages/tpo/reports/index.js`
- [ ] L11-U025 (FE page) `docs/legacy-source/frontend/src/pages/tpo/verification.js`
- [ ] L11-U028 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js`
- [ ] L12-U009 (FE page) `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js`
- [ ] L12-U014 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java`
- [ ] L12-U023 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java`
- [ ] L13-U019 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java`
- [ ] L13-U029 (FE page) `docs/legacy-source/frontend/src/pages/tpo/batches/index.js`
- [ ] L14-U026 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java`
- [ ] L15-U021 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java`
- [ ] L15-U031 (Cross-cutting area) `cross/15: Learning flow: courses, lessons, quizzes, assignments, attendance, grading, certificates`
- [ ] L17-U027 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java`
- [ ] L18-U017 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java`
- [ ] L18-U027 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java`
- [ ] L19-U023 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java`
