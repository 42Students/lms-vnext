# Gap audit v2 queue: lane chat-15

31 audit units, grouped by domain. This is an AUDIT ONLY job: do NOT change any code; the only files you write are docs/audit/gap2/lane-15/*.md (one per unit) and this queue file. We will divide the fixes after the audit completes.

Reference material: the old LMS source is in docs/legacy-source/frontend/src and docs/legacy-source/backend/src (read-only); summaries in docs/audit/legacy-inventory-A.md, legacy-inventory-B.md, legacy-copy-A.md, legacy-copy-B.md, docs/design/*; vNext code in src/ (pages in src/app, services in src/modules, API in src/app/api, schema in src/db and drizzle).

For EACH unit, read the legacy file AND its whole closure (components it imports, API calls it makes, the backend controller/service/validator/entity/migration behind it) and find the vNext equivalent (search by route, name, endpoint, wording). Write docs/audit/gap2/lane-15/<unit-slug>.md with:

1. Header: legacy file(s) read, backend files read, vNext file(s) mapped (or NONE).
2. A facet table with columns: ID | Facet | Legacy behaviour (cite file:line) | vNext behaviour (cite file:line, or NONE) | Verdict (MATCH, GAP, MISSING, EXTRA, UNKNOWN) | Severity (P0 broken/blocking, P1 wrong behaviour, P2 visible difference, P3 cosmetic or nice-to-have) | Fix (specific, concrete change) | Effort (S under 1h, M under 1 day, L more).
3. EVERY facet below needs at least one row, even when the verdict is MATCH (cite evidence) or N/A (say why). Split a facet into many rows when there are many differences: one row per distinct difference, never summarize several into one. Tiny differences count: a label, a default, a sort order, a max length, a toast wording, a disabled state, an empty value placeholder.
4. A final section 'Unit summary': counts per verdict and severity, and the three most important gaps.

IDs are G2-15-<unit number>-<row number>. Be literal and exhaustive: the goal is that after this audit nothing else needs discovering. If legacy behaviour cannot be determined from the code, mark UNKNOWN and say exactly what to check live.

Facets (all mandatory):
- F01 Purpose, entry points and navigation (how a user reaches it, menu label, route, breadcrumbs, redirects, back links)
- F02 Layout and section order (every section, heading, card, in order)
- F03 Every visible element: buttons, links, badges, icons, tooltips, helper texts, counters
- F04 Data shown: every field, source API field/column, formatting (dates, numbers, currency, names, empty value placeholders)
- F05 Tables and lists: columns, order, sort, default sort, filters, search, pagination, page size, row actions, bulk actions, row click, selection
- F06 Forms: every field, type, default, required, min/max, patterns, dependent fields, disabled rules, autofill, submit and cancel behaviour
- F07 Validation and error messages: client and server, exact wording, where shown, field-level and page-level
- F08 Success, info and confirmation messages and toasts (exact wording, when, how long)
- F09 Modals, drawers, popovers, menus, dialogs opened from here (each one: trigger, content, actions, results)
- F10 Actions and side effects: every API call (method, path, payload, response handling), DB writes, emails, notifications, audit entries, status transitions
- F11 Permissions: which roles see it, which see which parts, tenant and ownership rules, module toggles, what happens when not allowed
- F12 Business rules and formulas: eligibility, limits, calculations, defaults, statuses and transitions, date rules, uniqueness, soft delete
- F13 Empty, loading, error, offline and session-expired states
- F14 Exports, imports, downloads, uploads, file rules, templates, error reports
- F15 Notifications and emails triggered or shown (templates, recipients, timing, unsubscribe)
- F16 Responsive and mobile behaviour, touch targets, what changes at tablet and phone widths
- F17 Keyboard, focus, screen reader, accessibility details
- F18 Wording: titles, labels, buttons, placeholders, messages vs the legacy copy catalogue (docs/audit/legacy-copy-A.md and B.md)
- F19 Performance and data volume behaviour (pagination, lazy load, caching, large lists, timeouts)
- F20 Edge cases, race conditions, concurrency, idempotency, time zones, rounding, special characters, very long text
- F21 Integrations and background processing touching this unit (jobs, queues, webhooks, third parties)
- F22 Data model parity: tables, columns, types, constraints, indexes, enums, migrations behind this unit (compare with src/db schema and drizzle migrations)
- F23 Anything in vNext that does NOT exist in the legacy unit (EXTRA) and anything in legacy that vNext dropped on purpose (document the reason if known)

One unit at a time: finish the unit file completely before opening the next. Tick [x] the unit here in the same push as its file. Push to chatgpt/chat-15-b with [chat-15] after every 2 units (git fetch and rebase right before). Units:
- [x] U001 (FE page) `docs/legacy-source/frontend/src/pages/teacher/courses/index.js`
- [x] U002 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/StudentPlacementLookup.js`
- [x] U003 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/lessons.js`
- [x] U004 (FE page) `docs/legacy-source/frontend/src/pages/learn/projects/index.js`
- [x] U005 (FE page) `docs/legacy-source/frontend/src/pages/learn/my-placements/jobs/[jobId].js`
- [x] U006 (FE page) `docs/legacy-source/frontend/src/pages/learn/courses/index.js`
- [x] U007 (FE page) `docs/legacy-source/frontend/src/pages/college-admin/student-groups.js`
- [x] U008 (FE page) `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabusDetail.js`
- [x] U009 (FE page) `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js`
- [x] U010 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/EmailVariableValidator.java`
- [x] U011 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java`
- [x] U012 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java`
- [x] U013 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java`
- [x] U014 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobRoundRepository.java`
- [x] U015 (BE job/integration/template) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobEligibilityOverride.java`
- [x] U016 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java`
- [x] U017 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectResourceAudit.java`
- [ ] U018 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertSignature.java`
- [ ] U019 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java`
- [ ] U020 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java`
- [ ] U021 (BE entity (table parity)) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java`
- [ ] U022 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java`
- [ ] U023 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java`
- [ ] U024 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminE2eController.java`
- [ ] U025 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterCollegeController.java`
- [ ] U026 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java`
- [ ] U027 (BE controller) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java`
- [ ] U028 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js`
- [ ] U029 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/semesters.js`
- [ ] U030 (FE page) `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js`
- [ ] U031 (Cross-cutting area) `cross/15: Learning flow: courses, lessons, quizzes, assignments, attendance, grading, certificates`
