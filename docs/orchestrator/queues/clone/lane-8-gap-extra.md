# Gap audit v2 EXTRA queue: lane chat-8

The audit now runs on 10 lanes. These 18 units were reassigned to you from retired lanes 11-20. Same job as your main queue (docs/orchestrator/queues/clone/lane-8-gap.md): AUDIT ONLY, no code changes, same 14+ mandatory facets F01-F23 and same facet table, same verdicts and severities, same rules (read the whole legacy closure, one row per distinct difference, UNKNOWN when it cannot be determined).

Differences: each item is tagged L<origin lane>-U<unit>. Write docs/audit/gap2/lane-8/l<origin lane>-u<unit>-<slug>.md. Row IDs are G2-<origin lane>-<unit number>-<row number>. Tick items in THIS file (lane-8-gap-extra.md) and push to chatgpt/chat-8-b with [chat-8] after every 2 units. If an audit doc for the unit already exists on main under docs/audit/gap2/lane-<origin lane>/, read it, extend it only if thin, and tick the item.

Order of work: finish the unit you are on in your main queue, then continue the main queue to the end, then do this extra queue top to bottom. Strictly one unit at a time.

- [x] L11-U015 (FE page) `docs/legacy-source/frontend/src/pages/tpo/index.js`
- [x] L11-U018 (FE page) `docs/legacy-source/frontend/src/pages/tpo/notifications.js`
- [x] L11-U021 (FE page) `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js`
- [x] L11-U024 (FE page) `docs/legacy-source/frontend/src/pages/tpo/settings.js`
- [x] L11-U027 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java`
- [x] L11-U030 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js`
- [ ] L12-U012 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/MailDomainResolver.java`
- [ ] L12-U021 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AssignmentUploadReceipt.java`
- [ ] L12-U028 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js`
- [ ] L13-U024 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java`
- [ ] L14-U021 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java`
- [ ] L14-U031 (Cross-cutting area) `cross/14: Academic structure: departments, batches, semesters, sections, course delivery, teaching assignments, promotion`
- [ ] L15-U026 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java`
- [ ] L17-U022 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoPlacementsPageController.java`
- [ ] L18-U012 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/NotificationService.java`
- [ ] L18-U022 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java`
- [ ] L19-U018 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java`
- [ ] L19-U028 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/meetings.js`
