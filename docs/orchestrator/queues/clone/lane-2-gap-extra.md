# Gap audit v2 EXTRA queue: lane chat-2

The audit now runs on 10 lanes. These 10 units were reassigned to you from retired lanes 11-20. Same job as your main queue (docs/orchestrator/queues/clone/lane-2-gap.md): AUDIT ONLY, no code changes, same 14+ mandatory facets F01-F23 and same facet table, same verdicts and severities, same rules (read the whole legacy closure, one row per distinct difference, UNKNOWN when it cannot be determined).

Differences: each item is tagged L<origin lane>-U<unit>. Write docs/audit/gap2/lane-2/l<origin lane>-u<unit>-<slug>.md. Row IDs are G2-<origin lane>-<unit number>-<row number>. Tick items in THIS file (lane-2-gap-extra.md) and push to chatgpt/chat-2-b with [chat-2] after every 2 units. If an audit doc for the unit already exists on main under docs/audit/gap2/lane-<origin lane>/, read it, extend it only if thin, and tick the item.

Order of work: finish the unit you are on in your main queue, then continue the main queue to the end, then do this extra queue top to bottom. Strictly one unit at a time.

- [x] L12-U031 (Cross-cutting area) `cross/12: Global shell: header, sidebar, menus per role, breadcrumbs, route titles, redirects, 404/403/500 pages`
- [x] L13-U028 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js`
- [x] L14-U025 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java`
- [x] L15-U020 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java`
- [x] L15-U030 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js`
- [x] L17-U026 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java`
- [ ] L18-U016 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAttempt.java`
- [ ] L18-U026 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java`
- [ ] L19-U022 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java`
- [ ] L20-U031 (Cross-cutting area) `cross/20: Public pages, marketing pages, privacy/terms, demo requests, unsubscribe pages, invites`
