# Gap audit v2 EXTRA queue: lane chat-10

The audit now runs on 10 lanes. These 10 units were reassigned to you from retired lanes 11-20. Same job as your main queue (docs/orchestrator/queues/clone/lane-10-gap.md): AUDIT ONLY, no code changes, same 14+ mandatory facets F01-F23 and same facet table, same verdicts and severities, same rules (read the whole legacy closure, one row per distinct difference, UNKNOWN when it cannot be determined).

Differences: each item is tagged L<origin lane>-U<unit>. Write docs/audit/gap2/lane-10/l<origin lane>-u<unit>-<slug>.md. Row IDs are G2-<origin lane>-<unit number>-<row number>. Tick items in THIS file (lane-10-gap-extra.md) and push to chatgpt/chat-10-b with [chat-10] after every 2 units. If an audit doc for the unit already exists on main under docs/audit/gap2/lane-<origin lane>/, read it, extend it only if thin, and tick the item.

Order of work: finish the unit you are on in your main queue, then continue the main queue to the end, then do this extra queue top to bottom. Strictly one unit at a time.

- [x] L12-U029 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js`
- [x] L13-U026 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java`
- [x] L14-U023 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java`
- [x] L15-U018 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertSignature.java`
- [x] L15-U028 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js`
- [x] L17-U024 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminBugTrackerController.java`
- [x] L18-U014 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/EmailSuppressionRepository.java`
- [x] L18-U024 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java`
- [x] L19-U020 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java`
- [x] L19-U030 (FE page) `docs/legacy-source/frontend/src/pages/tpo/profile.js`
