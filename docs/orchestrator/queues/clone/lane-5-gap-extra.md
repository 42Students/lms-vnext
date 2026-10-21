# Gap audit v2 EXTRA queue: lane chat-5

The audit now runs on 10 lanes. These 11 units were reassigned to you from retired lanes 11-20. Same job as your main queue (docs/orchestrator/queues/clone/lane-5-gap.md): AUDIT ONLY, no code changes, same 14+ mandatory facets F01-F23 and same facet table, same verdicts and severities, same rules (read the whole legacy closure, one row per distinct difference, UNKNOWN when it cannot be determined).

Differences: each item is tagged L<origin lane>-U<unit>. Write docs/audit/gap2/lane-5/l<origin lane>-u<unit>-<slug>.md. Row IDs are G2-<origin lane>-<unit number>-<row number>. Tick items in THIS file (lane-5-gap-extra.md) and push to chatgpt/chat-5-b with [chat-5] after every 2 units. If an audit doc for the unit already exists on main under docs/audit/gap2/lane-<origin lane>/, read it, extend it only if thin, and tick the item.

Order of work: finish the unit you are on in your main queue, then continue the main queue to the end, then do this extra queue top to bottom. Strictly one unit at a time.

- [ ] L12-U016 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java`
- [ ] L12-U025 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java`
- [ ] L13-U021 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java`
- [ ] L13-U031 (Cross-cutting area) `cross/13: Dashboards and reports: every metric, formula, date range, drill-down`
- [ ] L14-U028 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js`
- [ ] L15-U023 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java`
- [ ] L17-U019 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/GradeAuditLog.java`
- [ ] L17-U029 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js`
- [ ] L18-U019 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyVerification.java`
- [ ] L18-U029 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js`
- [ ] L19-U025 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java`
