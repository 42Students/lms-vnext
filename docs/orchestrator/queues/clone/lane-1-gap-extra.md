# Gap audit v2 EXTRA queue: lane chat-1

The audit now runs on 10 lanes. These 13 units were reassigned to you from retired lanes 11-20. Same job as your main queue (docs/orchestrator/queues/clone/lane-1-gap.md): AUDIT ONLY, no code changes, same 14+ mandatory facets F01-F23 and same facet table, same verdicts and severities, same rules (read the whole legacy closure, one row per distinct difference, UNKNOWN when it cannot be determined).

Differences: each item is tagged L<origin lane>-U<unit>. Write docs/audit/gap2/lane-1/l<origin lane>-u<unit>-<slug>.md. Row IDs are G2-<origin lane>-<unit number>-<row number>. Tick items in THIS file (lane-1-gap-extra.md) and push to chatgpt/chat-1-b with [chat-1] after every 2 units. If an audit doc for the unit already exists on main under docs/audit/gap2/lane-<origin lane>/, read it, extend it only if thin, and tick the item.

Order of work: finish the unit you are on in your main queue, then continue the main queue to the end, then do this extra queue top to bottom. Strictly one unit at a time.

- [x] L11-U031 (Cross-cutting area) `cross/11: Forms: validation rules, error wording, required markers, date/number formats, phone/email handling`
- [x] L12-U013 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java`
- [x] L12-U022 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java`
- [x] L12-U030 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js`
- [x] L13-U027 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java`
- [x] L14-U024 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java`
- [x] L15-U019 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java`
- [x] L15-U029 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/semesters.js`
- [x] L17-U025 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java`
- [x] L18-U015 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java`
- [x] L18-U025 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java`
- [ ] L19-U021 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ApplyToJobRequest.java`
- [ ] L19-U031 (Cross-cutting area) `cross/19: Messaging, discussions, classroom/forum, announcements`
