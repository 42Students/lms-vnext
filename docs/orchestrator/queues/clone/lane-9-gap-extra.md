# Gap audit v2 EXTRA queue: lane chat-9

The audit now runs on 10 lanes. These 9 units were reassigned to you from retired lanes 11-20. Same job as your main queue (docs/orchestrator/queues/clone/lane-9-gap.md): AUDIT ONLY, no code changes, same 14+ mandatory facets F01-F23 and same facet table, same verdicts and severities, same rules (read the whole legacy closure, one row per distinct difference, UNKNOWN when it cannot be determined).

Differences: each item is tagged L<origin lane>-U<unit>. Write docs/audit/gap2/lane-9/l<origin lane>-u<unit>-<slug>.md. Row IDs are G2-<origin lane>-<unit number>-<row number>. Tick items in THIS file (lane-9-gap-extra.md) and push to chatgpt/chat-9-b with [chat-9] after every 2 units. If an audit doc for the unit already exists on main under docs/audit/gap2/lane-<origin lane>/, read it, extend it only if thin, and tick the item.

Order of work: finish the unit you are on in your main queue, then continue the main queue to the end, then do this extra queue top to bottom. Strictly one unit at a time.

- [x] L13-U025 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java`
- [x] L14-U022 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java`
- [x] L15-U017 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectResourceAudit.java`
- [x] L15-U027 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java`
- [x] L17-U023 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerOfferController.java`
- [x] L18-U013 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchCache.java`
- [x] L18-U023 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerEligibilityController.java`
- [ ] L19-U019 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java`
- [ ] L19-U029 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/ReadinessGate.js`
