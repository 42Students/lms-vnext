# Gap audit v2 EXTRA queue: lane chat-7

The audit now runs on 10 lanes. These 11 units were reassigned to you from retired lanes 11-20. Same job as your main queue (docs/orchestrator/queues/clone/lane-7-gap.md): AUDIT ONLY, no code changes, same 14+ mandatory facets F01-F23 and same facet table, same verdicts and severities, same rules (read the whole legacy closure, one row per distinct difference, UNKNOWN when it cannot be determined).

Differences: each item is tagged L<origin lane>-U<unit>. Write docs/audit/gap2/lane-7/l<origin lane>-u<unit>-<slug>.md. Row IDs are G2-<origin lane>-<unit number>-<row number>. Tick items in THIS file (lane-7-gap-extra.md) and push to chatgpt/chat-7-b with [chat-7] after every 2 units. If an audit doc for the unit already exists on main under docs/audit/gap2/lane-<origin lane>/, read it, extend it only if thin, and tick the item.

Order of work: finish the unit you are on in your main queue, then continue the main queue to the end, then do this extra queue top to bottom. Strictly one unit at a time.

- [x] L12-U020 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java`
- [x] L12-U027 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java`
- [ ] L13-U023 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerScheduleController.java`
- [ ] L14-U020 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java`
- [ ] L14-U030 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewEditForm.js`
- [ ] L15-U025 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterCollegeController.java`
- [ ] L17-U021 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java`
- [ ] L17-U031 (Cross-cutting area) `cross/17: Projects end to end: workspaces, teams, tasks, mentors, meetings, submissions, evaluation`
- [ ] L18-U021 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/JobImportantDateEventDTO.java`
- [ ] L18-U031 (Cross-cutting area) `cross/18: People management: onboarding, bulk import, profile fields, suspension, roles, deletion`
- [ ] L19-U027 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java`
