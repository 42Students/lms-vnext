# College Admin remaining parity gaps

> Inventory only. The canonical state remains `docs/planning/account-surface-parity.md` and `docs/tracker.json`; this is not another completion tracker or permission to close existing tasks.

**Scope reviewed:** `docs/planning/account-surface-parity.md` §4.1–4.7 and `docs/parity/college-admin.md`, against registered `drizzle/meta/_journal.json` and `src/db/schema/index.ts` (2026-10-14).

**Rows:** 59 College Admin matrix entries; 56 not DONE (55 PARTIAL, 1 VERIFY). This document lists every non-DONE row; 3 DONE rows are intentionally excluded.

**Blocker vocabulary:** **Buildable** = migrated table and/or existing capability makes the next parity action feasible, but implementation and acceptance evidence remain. **Needs owner decision** = cannot responsibly choose UX/retention semantics. **Missing migrated table** = only draft/unregistered schema exists; do not query it by default.

## Parity inventory

| Group | College Admin row | Matrix status | Blocker classification and concrete remaining acceptance work |
| --- | --- | --- | --- |
| 4.1 | Dashboard | PARTIAL | Buildable — reconcile legacy dashboard cards, completion states, count scopes, deep links and mobile/browser proof. |
| 4.1 | Activity Log | PARTIAL | Buildable — actor/entity/date filters, high-volume noise controls, full drill-in and cross-college denial coverage. |
| 4.1 | Self Profile | PARTIAL | Buildable — exact legacy profile sections, contact edits, resume/identity document safety and incomplete-section isolation. |
| 4.1 | Placement Interview Calendar | PARTIAL | Buildable — exact calendar filters, interview click-through and browser/DB acceptance. |
| 4.2 | Programs | PARTIAL | Buildable — reconcile dedicated program CRUD/list with legacy form, active/archive lifecycle and browser acceptance. |
| 4.2 | Semesters | PARTIAL | Buildable — add/edit/delete registered program terms, required name, immutable number and dependency guards. |
| 4.2 | Semester–Course Mapping | PARTIAL | Buildable — map registered program_term_courses to real term selector, add/unmap and duplicate conflict checks. |
| 4.2 | Batches | PARTIAL | Buildable — cohort CRUD, student modal/moves and safe progression integrations against registered tables. |
| 4.2 | Classes | PARTIAL | Buildable — section CRUD, capacity, recurring schedule setup and conflict/result reporting. |
| 4.2 | Batch Promotion | PARTIAL | Buildable — read-first preview and confirmed PROMOTE mutation authored (version-CAS, blocker recheck, history/audit); GRADUATE and legacy/browser/PG acceptance remain open. |
| 4.2 | Lecture Halls | PARTIAL | Buildable — migrated management exists; verify legacy field parity, conflicts, responsive behaviors and executed acceptance. |
| 4.2 | Electives | PARTIAL | Buildable — existing slot catalogue; implement selection/enrollment rules, finalize actions, feature-disabled behavior and denial tests. |
| 4.2 | Attendance | PARTIAL | Buildable — policy authority, exact grid/session corrections, department evidence, export and DB/browser acceptance. |
| 4.2 | Section operations / schedules | PARTIAL | Buildable — reconcile section scheduling, repeated sessions, dependencies and error/prerequisite paths with legacy. |
| 4.3 | Course detail | PARTIAL | Buildable — exact offering workspace sections, action/state parity, ownership and rollback/error behavior. |
| 4.3 | Lessons aggregate | PARTIAL | Buildable — creation, editing, reordering, detailed filters/export and legacy browser validation. |
| 4.3 | Video aggregate | PARTIAL | Buildable — read-only `/college/videos` now available; playback/storage authorization remains blocked pending secure storage flow. |
| 4.3 | Resources aggregate | PARTIAL | Buildable — read-only `/college/resources` now available; authoring, secure downloads and legacy detail parity remain. |
| 4.3 | Live Classes aggregate | PARTIAL | Buildable — indexed LIVE_CLASS view, upcoming/past filters, safe meeting-link handling and edit lifecycle. |
| 4.3 | Assignments aggregate | PARTIAL | Buildable — authoring and submissions/results drilldown, attachment controls, instructor actions and browser/DB acceptance. |
| 4.3 | Quizzes aggregate | PARTIAL | Buildable — question authoring, attempt/result drilldown, publication and instructor actions with real DB denial proof. |
| 4.3 | Course Progress | PARTIAL | Buildable — defined enrollment denominator, learner-level completion semantics, export and browser evidence. |
| 4.4 | Faculty | PARTIAL | Buildable — invite/create/edit, lifecycle, profile detail and full teaching workload with role/tenant checks. |
| 4.4 | Faculty Assignment | PARTIAL | Buildable — assign/reassign/remove, duplicate/conflict checks and scheduling-side effects. |
| 4.4 | Students | PARTIAL | Buildable — CSV import preview + confirmed per-row onboarding/enrollment authored; lifecycle, academic moves and learner profile drill-in remain, as do executed PG/browser checks. |
| 4.4 | Student Groups list | PARTIAL | Buildable — group create/edit/status changes, CSV import and dynamic rule controls. |
| 4.4 | Student Group detail | PARTIAL | Buildable — member add/remove/lock, waitlist actions, eligibility rules and denial paths. |
| 4.5 | Drives landing | PARTIAL | Buildable — legacy tab/list/filter parity and College Admin scoped placement operations. |
| 4.5 | Drive Overview | PARTIAL | Buildable — complete job detail sections, statuses, actions and browser parity. |
| 4.5 | Applications | PARTIAL | Buildable — dedicated applicant list, screening actions, export and cross-college denial tests. |
| 4.5 | Interviews | PARTIAL | Buildable — dedicated interview rounds, scheduling/results, guardrails and UI states. |
| 4.5 | Shortlisted | PARTIAL | Buildable — persist shortlist decisions and display history/denial states in dedicated tab. |
| 4.5 | Job Settings | PARTIAL | Buildable — validated job edits, lifecycle guards, consistency across applications/rounds. |
| 4.5 | Companies | PARTIAL | Buildable — dedicated company relationship management, notes and ownership validation. |
| 4.5 | Hiring Analytics | PARTIAL | Buildable — verified funnel/offer figures beyond evidence-only counts; define accurate denominators and date ranges. |
| 4.5 | Placement Cell / TPO workspace | PARTIAL | Buildable — compare legacy acting-as-TPO navigation and restrict actions to College Admin permissions. |
| 4.6 | Workspaces list | PARTIAL | Buildable — legacy list filters, row actions, mentor/team context and browser parity. |
| 4.6 | At Risk | PARTIAL | Buildable — verify definitions, actionable drilldowns and real DB/browser acceptance. |
| 4.6 | Readiness | PARTIAL | Buildable — verify project readiness semantics, thresholds, drilldowns and action handling. |
| 4.6 | Submissions | PARTIAL | Buildable — review workflow, attachment policies and submission drilldown parity. |
| 4.6 | Templates catalogue | PARTIAL | Buildable — complete dedicated browse/filter/create/catalogue actions with authorized template scope. |
| 4.6 | Template detail | PARTIAL | Buildable — dedicated detail, version/history and safe template assignment controls. |
| 4.6 | Project Audit | PARTIAL | Buildable — audit event taxonomy, actor filters, deep links and browser/DB acceptance. |
| 4.6 | Create Workspace | PARTIAL | Buildable — source-matched creation form, validations and atomic workspace materialization. |
| 4.6 | Reassign Mentor | PARTIAL | Buildable — bulk mentor reassignment with preview, capacity/conflict checks and atomic approval. |
| 4.6 | Deleted Workspaces | VERIFY | Needs owner decision — legacy deleted-workspaces page was challenged; decide restore/retention UX before implementing. |
| 4.7 | Summary | PARTIAL | Buildable — metadata, archival/deletion controls and section routes compared with legacy. |
| 4.7 | Overview | PARTIAL | Buildable — project narrative, deliverables and definition-of-done edit controls. |
| 4.7 | Team | PARTIAL | Buildable — role/membership management, invitations and mentor replacement actions. |
| 4.7 | Sprints | PARTIAL | Buildable — full sprint lifecycle, status gating and editing behavior. |
| 4.7 | Tasks | PARTIAL | Buildable — complete board/task status transitions, ownership and evidence workflows. |
| 4.7 | Resources | PARTIAL | Buildable — URL/text operations; private file upload needs secure storage capability before parity. |
| 4.7 | Meetings | PARTIAL | Buildable — scheduling/complete/cancel with notification and conflict semantics. |
| 4.7 | Readiness | PARTIAL | Buildable — score sources and admin approval/action behaviors, not just read-only metric. |
| 4.7 | Delivery | PARTIAL | Buildable — final deliverable review, permissions, attachments and acceptance proof. |
| 4.7 | Audit | PARTIAL | Buildable — history event coverage, filters and full subject/detail drilldown. |

## Explicit cross-cutting blockers and non-matrix surfaces

- **Announcements — Missing migrated table:** `/college/announcements` and service exist, but `src/db/schema/db10-announcements.draft.ts` is unregistered in the Drizzle journal and `announcementsRuntimeEnabled()` requires `DB10_ANNOUNCEMENTS_READY=DB10_VERIFIED`. It must not execute draft-table reads/writes before schema promotion, fresh replay and safe service activation. No claim that notices are delivered.
- **Fee / separate notice views — Needs owner decision, then migration check:** no distinct Fee or Notice row is enumerated in §4 College Admin, and this review establishes no registered fee/notice persistence contract. Clarify legacy jobs, entity ownership, payment sensitivity and whether Notice means the DB10 announcement workflow before adding rows or inventing counts.
- **College-wide contact/profile — Buildable pending owner scope:** registered `colleges` address fields and `college_branding` support contacts are separate from the existing *Self Profile* row (`/college/profile`). A separate college contact profile requires a precise requested legacy contract and permissions; do not reinterpret the self-profile screen or disclose private contacts implicitly.
- **Private media/attachments — Buildable metadata, storage blocked:** VIDEO/RESOURCE aggregate pages added in this batch purposely omit `storage_key`, notes, external URLs and signed media endpoints. This does not prove storage playback/download parity.
- **Verification — Buildable:** every PARTIAL row still requires applicable executed ESLint/TypeScript, disposable-PostgreSQL positive and denial tests, responsive browser walkthrough, exact legacy evidence and owner approval when warranted. Authored tests alone do not satisfy closure.

## Batch contribution

- Added read-only `/college/videos` and `/college/resources` over registered `lesson_contents` metadata with per-college course/program/period ancestry joins, central permission checks, Zod boundaries, search/status/pagination, loading/error/empty states and no content URL disclosures.
- Added model tests and a disposable-PostgreSQL tenant/role-denial witness. **Neither test execution nor complete legacy parity is claimed by this inventory.**
- Kept both source matrix rows `PARTIAL`; did not mark any tracker task DONE.
