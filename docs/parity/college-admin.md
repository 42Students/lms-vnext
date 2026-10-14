# College Admin — Detailed Page Parity Spec

Legacy sidebar: Dashboard, Activity Log, Academic Setup, Courses & Content, People, Placements, Placement Cell, Projects, Profile.

Every page below also requires:
- correct College Admin role fence;
- fixed current-college scope;
- explicit "admin not assigned to a college" state where legacy has it;
- no cross-college object lookup by id;
- loading/empty/error states;
- responsive behavior;
- executed regression coverage.

# Operations

**Personal-notification unread counts PARTIAL (2026-10-15):** College Admin announcements displays a separate exact unread own-recipient count from registered notifications, independently of the 50-row inbox cap and regardless of unread-only filter. Count reads enforce the signed-in college and recipient; no college-wide send or delivery is inferred. Model, isolated PG tenant/role fixture updates authored; runtime/browser acceptance outstanding.

**Announcements personal inbox unread filter PARTIAL (2026-10-15):** College Admin notices can filter unread, own-recipient *registered* notifications within the signed-in college before the 50-row cap. Toggle preserves the deleted-announcement selector. The draft college-wide DB10 announcement table remains gated and no broadcast sending is claimed. Pure model and isolated PG own/foreign/wrong-role tests authored; runtime/browser acceptance open.

## Page: Dashboard
**Empty-source follow-ups PARTIAL (2026-10-15):** Dashboard adds an actionable, zero-only list of deep links to relevant directories. It never calls an unavailable count zero, and deliberately says an empty source is not a setup failure, readiness score or student-performance alarm. Pure-model and existing scoped PG read fixtures cover the projection; exact legacy priority cards and browser acceptance remain open.
**Legacy:** `/college-admin/dashboard`

**Count cards PARTIAL (2026-10-14):** `/college` now renders eight source-authored overview cards (active student/faculty memberships, active courses, non-archived batches, active classes, active teaching assignments, active lecture halls and published jobs). Counts reuse the same signed-in-college `getCollegeSetupChecklist` query as the setup evidence, with central `can()/requirePermission()` and fixed internal deep links. The pure model renders missing values as Unavailable, not zero; failing DB reads surface the dashboard error boundary. These are registered record counts, not attendance, readiness or total hours. Legacy KPI/attention definitions and executed browser/DB acceptance remain open.

**Setup evidence PARTIAL:** `/college` now renders the canonical dashboard setup phases with registered, college-scoped persisted counts for departments, courses, active lessons, published lesson content, programs, program terms, curriculum mappings, cohorts, sections, faculty/student role memberships, active teaching assignments, lecture halls and published jobs. Each step deep-links to its actual College Admin page. Nonzero count means source records exist, never that the complete legacy job or all setup prerequisites are finished. Counts load atomically as a response (no silent partial failure), with dashboard loading/error states. Exact KPI/attention cards, full readiness rules and browser acceptance remain open.
  
Legacy route maps dashboard quick actions to Departments, Courses, Programs, Faculty, Students, Lessons, Content, Semesters, Semester-Course Mapping, Batches, Classes, Batch Promotion, Faculty Assignment, Lecture Halls, Jobs, Hiring Dashboard, Attendance, Assignments, Quizzes and People.

- [ ] Dashboard KPI/summary cards match the legacy AdminDashboardView.
- [ ] Setup/attention/quick-action cards match.
- [ ] Every quick action resolves to the correct College Admin page.
- [ ] College-scoped counts use the active college only.
- [ ] "Admin not assigned to a college" warning state matches.
- [ ] Partial-data failure never renders false zeroes.
- [ ] Loading and responsive card layout are verified.

## Page: Activity Log
**IST recent-activity shortcuts PARTIAL (2026-10-15):** Activity Log now offers Last 7 days and Last 30 days as exact inclusive Asia/Kolkata calendar intervals, plus Clear date range, preserving other actor/module/entity filters while resetting the pagination cursor. Unit tests cover IST midnight and year boundaries, with disposable PG bounded-search role fixtures; browser/runtime and legacy acceptance remain open.
**Non-UUID audit subject lookup PARTIAL (2026-10-15):** Activity Log accepts bounded exact persisted event subject identifiers up to 500 characters, including legacy/composite keys, rather than wrongly insisting every subject is UUID. The export already validates the same 500-character contract. The page label, Zod, URL and scoped PG denial/no-match fixtures were updated; acceptance remains pending.
**Actor-name audit triage PARTIAL (2026-10-15):** Actor display-name substring filtering is now available alongside exact actor UUID; it uses the existing escaped server search before scoped cursor paging and capped CSV export, with no direct user-directory disclosure. Zod, URL and isolated PG no-match/denial fixtures authored; real browser/PG and exact legacy taxonomy parity remain open.
**Scoped audit text search PARTIAL (2026-10-15):** College Admin can search persisted summary, subject label/ID/type and event type before cursor pagination using escaped literal PostgreSQL matching. The capped CSV export carries the query through the existing shared audit read service. Zod/URL and scoped PG positive/no-match/wrong-role fixtures authored; legacy/browser/executed database acceptance remain open.
**Entity-filtered CSV PARTIAL (2026-10-15):** The 1,000-row Activity Log CSV now carries the exact subject ID filter used by the web history. Subject IDs are bounded at 500 characters (audit subjects are not necessarily UUIDs); CSV service keeps server-derived college scope, no caller-supplied tenant selector, and isolated PG own/foreign fixtures. Historical CSV volume, legacy format and executed browser/PG acceptance remain open.

**Triage filters PARTIAL (2026-10-15):** Added registered module, importance and exact event-type filters to college-scoped activity history. The cursor preserves every filter, and capped CSV export receives the same triage selectors. Strict Zod rejects invalid modules/severity; isolated PG coverage checks filtering and cross-college scope. Noise grouping, legacy filter semantics and executed browser/PG acceptance remain open.

**CSV export PARTIAL (2026-10-14):** College Admin Activity Log adds a download matching actor/subject/IST date filters and the broader Activity Center adds module/importance/event filters. Both use the same read service, scoped to the current college, with a 1,000-event cap, spreadsheet-formula neutralization, and explicit truncation footer and HTTP headers. No data is mutated. Exact legacy export column parity and high-volume browser/PG acceptance remain open.

**Read-first PARTIAL (2026-10-14):** `/college/activity` provides explicit actor/entity/date filters, newest-first cursor pagination and `/college/activity/[eventId]` for sanitized audit metadata. Both reads are denied outside the active College Admin membership college. Records are never edited or deleted. Exact legacy event grouping, export, browser and independently executed PostgreSQL acceptance remain open.

**Legacy:** `/college-admin/audit`

- [ ] Timeline/list event taxonomy matches meaningful admin activity.
- [ ] Actor/entity/action/date filters match.
- [ ] Detail drill-in or expandable event context matches.
- [ ] High-volume/noisy activity remains usable via filtering/grouping.
- [ ] Empty/loading/error/stale states match.
- [ ] College boundary is enforced.

## Page: Profile
**Legacy:** `/college-admin/profile`

Uses the shared Faculty-profile schema.

- [ ] User summary/profile image/completeness.
- [ ] Resume upload/import/remove.
- [ ] Contacts, social, address, personal details and identity.
- [ ] Aadhaar/PAN storage flows.
- [ ] Experience, education, skills, certifications and languages.
- [ ] Publications and awards.
- [ ] Metadata.
- [ ] Add/edit/delete dialogs/inline edit states for every collection section.
- [ ] Partial profile endpoint failures do not blank the page.
- [ ] Loading/hard-error/retry/visibility-refresh behavior.
- [ ] Learner/Faculty/Mentor/TPO role misroutes are fenced.


## Page: College Contact Profile

**Additional College Admin contact surface (PARTIAL):** `/college/college-profile` is separate from the legacy personal profile. Read public college display name, support email/phone and HTTPS terms/privacy links; confirmed edits use own-college scope, registered branding validation, optimistic version checks and a privacy-safe activity audit in one transaction. Does not expose personal account edits, sensitive identity data, college code/address or visual branding writes. Loading/error states and denial tests authored; executed disposable PostgreSQL/browser acceptance and final scope decision remain open.

## Page: Placement Interview Calendar
**Legacy:** `/college-admin/calendar`

- [ ] Calendar displays interviews across the college.
- [ ] Company/job/date filtering matches.
- [ ] Event click can open the relevant job/applications.
- [ ] Empty/no-college/error states match.
- [ ] Date/time/timezone handling is correct.

# Academic Setup

## Page: Departments
**Legacy:** `/college-admin/departments` using shared `Departments` component.

**College Admin hardening PARTIAL:** Create, rename and archive now use dedicated same-origin-guarded, context-derived College Admin routes with strict Zod, row locks, same-transaction immutable audit and actual historic program/course/faculty-profile dependency guards before archive. A new confirmed restore action is available for archived Programs with active-department/name/code-conflict checks. Legacy UI/browser and independent PG acceptance remain open.

Legacy contract:
- Create New Department card;
- Department Name;
- Existing Departments table;
- search;
- CSV export;
- refresh;
- Edit Department modal;
- delete confirmation;
- delete blockers when children exist;
- load-error retry.

- [ ] Create form and validation match.
- [ ] Existing table columns/metadata match.
- [ ] Search matches.
- [ ] CSV export matches.
- [ ] Refresh behavior matches.
- [ ] Edit Department modal matches.
- [ ] Delete confirmation and dependency blockers match.
- [ ] Department Chair/Vice Chair legacy-noise fields remain absent unless a real current user job exists.
- [ ] Load/error/empty states match.

**W06 College Admin directory implementation (2026-10-10):** the existing College Admin `/college/departments` page now reuses `DepartmentDirectory`, matching the Super Admin search, CSV export, refresh, ten-row pagination and Programs/Courses/Faculty dependency counts. The `/college` layout enforces an active COLLEGE_ADMIN membership; server list uses only the active membership collegeId and the `department.read` service permission check. Each usage lookup is made only on IDs returned by that authorized query. Failed usage lookups show unknown (—), not 0. Legacy `/college-admin/departments` URL/bookmark is not yet aliased; browser behavior is not yet verified. Authored code does not advance this page to DONE.

## Page: Programs
**Legacy:** `/college-admin/programs`

**Write-side PARTIAL (2026-10-14):** `/college/programs` now uses strict Zod College Admin mutation contracts for create/edit/archive, with current-college ownership, `can()`/`requirePermission()`, isSameOriginRequest on all mutation routes, program-row locks, same-transaction activity audit entries and case-insensitive name/code conflicts. Archive confirmation is required in UI and server body; current/historical cohort, enrollment and curriculum term dependencies all block archive. Edits preserve immutable department and deny lowering duration below authored semester or recorded batch progression. Loading/error/empty states and search/CSV remain. Isolated PostgreSQL success/cross-college/denial tests authored, pending execution here. Legacy duration-years input, blocker detail view and browser acceptance remain open. Dirty program edits now require explicit discard confirmation.

Legacy contract:
- Create Program;
- Department selector;
- Program Name;
- Duration Years;
- Existing Programs;
- search/table toolbar;
- Edit Program modal;
- unsaved-change discard confirmation;
- delete confirmation + blockers for linked semesters/batches/classes;
- department load retry/no-department prerequisite state.

- [ ] Create form fields/validation match.
- [ ] Department dependency and no-department state match.
- [ ] Table/search/pagination match.
- [ ] Edit modal matches.
- [ ] Unsaved-change discard confirmation matches.
- [ ] Delete blockers and confirmation match.
- [ ] Load/error/empty states match.

## Page: Semesters
**Persisted minimum-credit filter PARTIAL (2026-10-15):** Semester directory and CSV now filter actual configured totalCredits inclusively before pagination, excluding unconfigured/null totals rather than inferring credits. Blank inputs are not coerced to zero. Unit and triggered-progression-safe PG fixture authored; execution/browser evidence open.

**Capped semester CSV PARTIAL (2026-10-15):** Filtered, college-authorized program terms export through a GET-only endpoint with 1,000-row limit, spreadsheet formula neutralization and explicit truncation headers/footer. Uses existing tenant-scoped pagination and a disposable-PostgreSQL tenant/role fixture; executed PG/browser and exact legacy column acceptance remain outstanding.

**Exact semester-number filter PARTIAL (2026-10-15):** Semesters now have bounded 1–24 term-number filtering in the college-scoped directory, URL pagination, accessible form and positive/negative isolated-Postgres fixture checks. Real PG/browser execution and legacy management parity still require acceptance.

**Subquery column collision repair PARTIAL (2026-10-15):** Semester directory projects distinct SQL aliases for term and program IDs/names, preserving the existing paginated API while avoiding PostgreSQL ambiguous-column errors (42702). Existing disposable-PG scope fixture now checks joined program identity; execution, legacy field comparison and mobile/browser acceptance remain outstanding.

**Term edit concurrency PARTIAL (2026-10-14):** The existing semester edit action now requires an explicit confirmed millisecond-safe updatedAt token and rejects stale writes. Deactivating a registered program term is blocked when its mapped curriculum courses exist or any active/non-archived cohort progression currently references its term number. Parent scope and immutable activity audit remain transactional; unit and in-test-fixture PostgreSQL stale/foreign-role/dependency checks updated. Exact legacy parity and executed gates remain open.

**Legacy:** `/college-admin/semesters`

**Academic-period lifecycle PARTIAL:** The separate `/college/academics` Academic Period table now requires confirmation for close/reopen. Registered `academic_periods` rows are locked in one transaction, active sections/scheduled sessions block closure, a stale or foreign-college target is rejected, and the same transaction writes immutable activity events. Reopen is explicit CLOSED → ACTIVE, distinct from PLANNED → ACTIVE. This does not equate an academic period with a numbered semester; browser/real-DB execution remains pending.

**Write-side PARTIAL (2026-10-14):** `/college/semesters` now supports create/edit/delete on registered DB-0050 `program_terms` via `/api/academics/semesters` and `/api/academics/semesters/[semesterId]`. Strict Zod requires semester name and validates configured credits/term number; editing keeps program and term number immutable. College role and central `academics.manage` scope are verified from request context, with same-origin checks on every mutation. Service locks program/term records in a transaction, validates program-duration limits, denies duplicate term numbers, and blocks deletion for mapped curriculum courses or any non-archived program cohort; all three mutation outcomes write an `activity_events` row in the same transaction. Inline edit and explicit deletion confirmation provided with honest errors. Added unit and disposable-PostgreSQL success/cross-tenant denial tests. Legacy dialog styling, final dependency inventory, independent executed lint/typecheck/DB/browser evidence remain open.

**Read-first PARTIAL (2026-10-14):** `/college/semesters` lists registered DB-0050 `program_terms` by program and term number, with mandatory authored name, isActive state, configured credits and only same-college `program_term_courses` counts. Uses server-side search, program/status filters, 25-row pagination and honest empty/loading/error states. This is a direct persisted term list, not an academic-period proxy. Legacy create/edit/delete, dependency confirmation, active-state transitions and UI/browser/database acceptance remain open.

Legacy contract:
- Program selector;
- Semester Number;
- Total Credits;
- mandatory Semester Name;
- Existing Semesters;
- filter by Program;
- search/table toolbar;
- Edit Semester modal with immutable program/semester number and editable credits/name/status;
- delete confirmation.

- [ ] Create fields/validation match, including mandatory Semester Name.
- [ ] Program prerequisite/selector behavior matches.
- [ ] Existing table/filter/search match.
- [ ] Edit modal fields and immutable fields match.
- [ ] Status edit behavior matches.
- [ ] Delete confirmation/dependency handling matches.
- [ ] Load/error/empty states match.

## Page: Semester–Course Mapping
**Persisted offering lifecycle filter PARTIAL (2026-10-15):** Course-mapping directory and CSV can now filter exact ACTIVE/ARCHIVED offering states before college-scoped pagination, independently of CORE/ELECTIVE type. Uses the authoritative offering-state enum, strict URL schema, safe export retention and gated own-college PG fixture assertions. Numbered program-term mapping and executed/browser parity remain open.

**Offering mapping CSV PARTIAL (2026-10-15):** Own-college academic-period offerings can be exported with the same persisted program/period/type filters as the directory, formula-safe capped 1,000 rows, truncation headers and status fields. This is explicitly *not* the separate numbered-term curriculum mapping export. Gated PostgreSQL in-test-fixture success/foreign/wrong-role coverage authored; runtime and legacy column acceptance open.

**Registered offering-type filter PARTIAL (2026-10-15):** College Admin can filter mapped course offerings by CORE/ELECTIVE using the shared authoritative type enum, strict URL state and same-college SQL filtering before pagination; isolated PostgreSQL fixture checks the positive and excluded type. The separate numbered-semester mapping workflow and executed PG/browser parity remain outstanding.

**Offering-mapping subquery repair PARTIAL (2026-10-15):** The College Admin mapping list now projects unique names for course/cohort/program/period identifiers, titles and codes to avoid PostgreSQL 42702 in paginated reads; isolated PG test additionally asserts the ancestry fields. Dedicated program-term assignment mutations and executed PG/mobile/legacy parity evidence remain open.

**Legacy:** `/college-admin/semester-courses`

**Read-first PARTIAL:** `/college/semester-courses` lists persisted college-owned course offerings by cohort/program/academic period with CORE/ELECTIVE type, credits, filters and offering links. Academic periods are not yet certified as legacy numbered semesters; no create/remove mapping writes and no complete browser parity.

- [ ] Program + semester context selectors match.
- [ ] Existing course mappings table/list matches.
- [ ] Add/mapping form supports course, offering/type and required metadata present in legacy.
- [ ] Remove/unmap confirmation matches.
- [ ] Duplicate mapping validation matches.
- [ ] CORE/ELECTIVE semantics remain correct.
- [ ] Search/filter/loading/empty/error states match.

## Page: Batches
**Recorded term progression filter PARTIAL (2026-10-15):** Batch view and capped CSV can isolate the exact migrated currentTermNumber from cohort_progression_state with 1–24 validation, same-college count/pagination and no inferred progression for missing rows. PostgreSQL fixture uses main\u0027s ON CONFLICT trigger-safe pattern; real execution/browser proof remains outstanding.

**Capped batch CSV PARTIAL (2026-10-15):** Batch catalogue now exports current-college, filter-matched persisted program/progression and active counts in a spreadsheet-neutralized CSV (1,000 max, explicit truncation headers/footer). The in-test-fixture PostgreSQL suite includes own/foreign/wrong-role export assertions; executed CI, mobile and legacy export column parity remain outstanding.

**Academic-year progression filter PARTIAL (2026-10-15):** Batch list can select the exact persisted progression academic-year start, rather than deriving a year from names or start periods; strict bounds, URL paging, absent-progression exclusion and positive/negative isolated PostgreSQL checks are authored. Browser and integration execution remain open.

**Subquery column collision repair PARTIAL (2026-10-15):** Batch directory now aliases cohort/program/starting-period IDs, names and codes individually before pagination (PostgreSQL 42702); the existing tenant-isolated fixture asserts joined identity and progression shape. No executed PostgreSQL/browser closure or legacy cohort form parity is claimed.


**Guarded batch removal PARTIAL (2026-10-14):** The Batches directory now offers an explicitly confirmed Remove action only for PLANNED cohorts. It archives the cohort instead of hard-deleting registered progression/state history; the transaction locks the college-owned cohort, applies millisecond-normalized optimistic updatedAt token, blocks any section, learner enrollment, course offering, progression event or advanced progression state, and appends immutable activity audit. Strict same-origin DELETE, unit model and gated disposable-PostgreSQL success/foreign/wrong-role/stale/dependency fixtures are authored. Remediation for retired batch codes (unique codes remain reserved), full legacy hard-delete policy and browser/real PG acceptance remain open; not DONE.

**Legacy:** `/college-admin/batches`

**Write-side PARTIAL (2026-10-14):** `/college/batches` adds a validated create form and confirmed edit dialog (name, code, expected end period) for PLANNED cohorts via dedicated `/api/college/batches` endpoints. Registered program, period, cohort and dependency rows are enforced under College Admin college scope; parent/subject locks, case-insensitive duplicate-name/code checks, same-college period date windows, child and progression-history guards, transactional audit and explicit cross-college denial are implemented. Create/edit do **not** allow start-period/program changes, bypass archived parents, mutate an existing progression state, or imply promotion. Legacy delete, student/class modal and move, academic-year recalculate, exact status/edit parity, browser/PG execution and full acceptance remain open.


**Read-first PARTIAL (2026-10-14):** `/college/batches` lists persisted cohorts with program, start academic period, status, and optional DB-0051 `cohort_progression_state` (current term and academic year), alongside scoped counts of active sections and active learner enrollments. Server-side search, program/status filters, 25-row pagination, explicit absent progression and empty/error states included. A cohort period is not interpreted as an exact legacy batch end date. Legacy create/edit/delete, learner drill-in/moves, promotion preview and true current-class attendance remain open. No database/browser acceptance claimed.

Legacy contract audited:
- Program;
- Batch Name;
- Start Date / End Date;
- Academic Year with recalculate helper;
- Status when editing;
- Program/status filters;
- Create/Edit/Delete;
- discard-edits confirmation;
- Students modal;
- class selector + student search;
- Move Student modal to another class;
- delete blockers when child data exists.

- [ ] Create form fields/validation match.
- [ ] Academic-year derivation/recalculate behavior matches.
- [ ] Status behavior matches.
- [ ] Program/status filters and table toolbar match.
- [ ] Edit modal + discard confirmation match.
- [ ] Delete blockers/confirmation match.
- [ ] Students modal is implemented.
- [ ] Class selector/student search inside Students modal match.
- [ ] Move Student modal and destination validation match.
- [ ] Student move history/state remains auditable.
- [ ] Loading/prerequisite/error states match.

## Page: Classes / Sections
**Configured upper-seat threshold PARTIAL (2026-10-15):** Classes list and capped CSV now support inclusive maximum configured Section capacity, separate from minimum capacity and registered active enrollment counts. Null capacities are not treated as zero; typed URL, blank-field and isolated PG boundary tests authored. Runtime/browser acceptance remains open.

**Class capacity filter PARTIAL (2026-10-15):** Admin Classes directory and capped CSV export now share strict minimum-configured-capacity filtering against saved Section capacity (unknown/null does not match), with URL retention and PG fixture for boundary inclusivity. No real PG/browser gates run; recurring scheduling and full parity remain open.

**Section lifecycle PARTIAL (2026-10-14):** The College Admin Classes directory now adds confirmed ACTIVE/ARCHIVED transitions for persisted Sections. Dedicated same-origin PATCH uses exact college and role permission, row lock, millisecond-truncated updatedAt token, an all-history dependency blocker covering enrollments, Faculty assignments, schedules and course deliveries, parent eligibility/active name-code collision on restore, and same-transaction immutable audit. Authored pure unit and disposable PG success, cross-college NOT_FOUND, wrong-role, stale-token and dependency tests. Executed real DB/browser acceptance and legacy/archive versus hard-delete semantics remain open.

**Legacy:** `/college-admin/classes`

**Recurring execution PARTIAL (2026-10-14):** `/college/classes/recurring-preview` adds an explicit, confirm-gated execution of its IST weekday pattern with a section-updatedAt millisecond token; the server rechecks current Section/Period/Faculty/Hall college scope, persisted section/faculty/hall overlaps and aborts the entire transaction on any conflict. The inserted session IDs and immutable section activity audit are returned only for a full success. Pure-model tests and disposable-PG fixture success/foreign-college/wrong-role/stale-token tests authored. Limits: the advisory lock serializes this writer by college+Section, but independently managed faculty/hall scheduling writers require broader shared lock policy or exclusion constraints; no cross-writer race guarantee or real CI/browser closure is claimed. Recurrence editing, bulk failure reports and course attachment remain outstanding.

**Recurring preview PARTIAL (2026-10-14):** `/college/classes/recurring-preview` accepts a selected class, weekday pattern, date range (maximum 93 days), IST-local start/end and optional in-college Faculty/lecture hall; it expands timestamps without server timezone dependence and reads migrated `section_schedule_events` to identify overlapping class, Faculty and hall sessions. It never writes sessions and is not an execution success forecast; the write must revalidate conflicts atomically. Confirmation, session materialization, linked course, historical series report and browser acceptance remain open.

**Write-side PARTIAL (2026-10-14):** `/college/classes` adds a confirmed College Admin create/edit flow through strict Zod, college-scoped, same-origin POST/PATCH routes. Transactions serialize with the cohort and period ancestry, enforce unique active class name/code, valid cohort-period range, capacity not below active enrolled learners and dependency guards on identity change, and append one actor audit event per success. Cancel/discard confirmation and empty/loading/error states retained. Legacy recurring scheduling, archival, detailed min/max students, browser/database acceptance and full parity remain open.

**Read-first PARTIAL (2026-10-14):** `/college/classes` now shows migrated class/section rows with program, cohort, academic period, configured capacity, active enrollments and lifecycle state. Includes program/status filters, search, 25-row pagination, college-scoped permissions, honest empty/loading/error states and a link to the existing section detail. Active enrollment counts use joined learner program/section enrollments with current in-college LEARNER memberships; no attendance, scheduled-session, or capacity-utilization metric is inferred. Legacy create/edit/delete, recurring-series scheduling, conflicts, moving learners, real-DB execution and browser parity remain open.

Legacy contract audited:
- Program;
- Batch;
- Class/Section Name;
- Description;
- min/max students;
- filters by program/batch;
- Create/Edit/Delete;
- unsaved edit confirmation;
- Schedule recurring sessions modal;
- schedule fields: title, date range, start/end, repeat days;
- optional course/faculty/lecture hall;
- series result report with failed rows.

- [ ] Create form fields/validation match.
- [ ] Program→Batch dependency matches.
- [ ] Capacity bounds validation matches.
- [ ] Filters/search/table match.
- [ ] Edit modal + discard confirmation match.
- [ ] Delete confirmation/consequences match.
- [ ] Schedule button exists where allowed.
- [ ] Recurring-session modal fields match.
- [ ] Course/Faculty/Lecture Hall option failures are recoverable.
- [ ] Created/failed series result summary matches.
- [ ] Schedule conflicts are surfaced, not silently dropped.

## Page: Batch Promotion
**Preview-binding PARTIAL (2026-10-14):** A confirmed PROMOTE now supplies the exact server-preview learner count, next term and academic year, and the transactional apply rechecks these after its normal blocker/version checks. A changed preview rejects with PROMOTION_PREVIEW_CHANGED instead of silently promoting a different cohort state. Unit and disposable PG stale-preview tests authored; the existing all-or-nothing progression history/audit remains. Graduation and independently executed browser/PG gates remain outstanding.

**Legacy:** `/college-admin/batch-promotion`

**Write-side PARTIAL (2026-10-14):** `/college/batch-promotion` retains the server-authored preview of up to 2,000 learner blocker checks and adds explicit confirmation for eligible **PROMOTE** cases. Same-origin POST requires strict Zod, College Admin and college scope. The transaction locks cohort/progression/enrollments, reruns the preview, rejects blockers and stale expected versions, updates term/year and version (+1), inserts registered cohort progression history and college-scoped immutable activity audit. No inferred period/class transfer. **GRADUATE** remains unavailable because registered history only permits PROMOTION (+1) and CORRECTION (same term); exact legacy/browser/runtime acceptance remains open.


Legacy contract:
- select Program;
- show/hide completed/inactive;
- batch table/current semester;
- Promote;
- Graduate when at max semester;
- server preview before promotion;
- Promotion modal;
- academic year override;
- student/class counts;
- invalid-preview/blocker alerts;
- explicit Graduate confirmation.

- [ ] Program filter and show-all toggle match.
- [ ] Promotion eligibility calculation matches.
- [ ] Server-side preview is required before mutation.
- [ ] Promotion modal counts/consequences match.
- [ ] Academic-year override validation matches.
- [ ] Invalid/blocking preview states match.
- [ ] Promotion mutation updates learner progression/class state atomically.
- [ ] Graduate confirmation and consequences match.
- [ ] Loading/error states match.

## Page: Lecture Halls
**Lecture hall CSV PARTIAL (2026-10-15):** The filter-matched College Admin hall directory exports up to 1,000 authorized room rows including configured seats/department/upcoming persisted scheduled-class count, neutralized for spreadsheet formulas with truncation indicators. CSV does not disclose scheduling contacts or personal data. Gated existing hall fixture adds own/foreign/role assertions; executed and UI/browser proof remain open.

**Seating-capacity filter PARTIAL (2026-10-15):** Room directory now accepts 1–5000 minimum configured seats, enforced by the shared scoped list query before pagination and persisted in filter links. Isolated PG fixture checks inclusive boundaries, with existing tenant and wrong-role denials unchanged. Execution and mobile/browser acceptance still open.

**Hall cancellation PARTIAL (2026-10-14):** A confirmed per-session Cancel action on the hall availability page now persists SCHEDULED→CANCELLED, takes a required reason and millisecond-safe updatedAt token, locks the owning college hall and session, and blocks sessions already started or linked to attendance/course-delivery evidence. One immutable section audit event is written transactionally. Same-origin PATCH, pure-model test and disposable-PostgreSQL cross-college, wrong-role, stale/evidence and positive fixtures authored. Rescheduling, cross-writer universal Hall locking and real browser/database execution remain open; PARTIAL only.

**Hall Faculty concurrency PARTIAL (2026-10-14):** The single-session booking writer now locks the selected Faculty account, membership and role exclusively before reading schedule overlap. Requests for the same Faculty in different halls/classes serialize through that lock; disabled Faculty are rejected. Pure active-identity tests and an in-test two-hall/two-class PostgreSQL concurrent overlap witness added. This covers this booking writer only: other schedule writers still need a shared lock convention or registered exclusion constraints. PostgreSQL execution remains blocked by sandbox user restrictions; legacy/browser verification and full rescheduling remain open.

**Hall booking PARTIAL (2026-10-14):** The per-hall IST availability page adds a confirmed single-session write with a validated IST-local date/time/title, same-college Section and optional Faculty, millisecond-normalized Section optimistic token, configured class capacity vs hall capacity guard, and fresh persisted SCHEDULED overlap checks for hall, Section or Faculty. It locks Section then Hall through the audit/insert transaction and advances the Section token; appends a college-scoped immutable event. Dedicated same-origin POST, pure time/capacity model tests and disposable PostgreSQL success, cross-college denial, wrong role, stale and overlap tests authored. Other scheduling writers without shared Hall locks or exclusion constraints can still race; exact legacy workflow and real DB/browser proof remain open; this is not guaranteed booking availability.


**IST hall availability PARTIAL (2026-10-14):** Each hall links to `/college/lecture-halls/[hallId]` for a strict 1–31-day IST date-range read of registered SCHEDULED section sessions. Own-college hall and academic lineage checks, not-found tenant concealment, persisted hall capacity, nullable configured class capacity, overlapping booking flags and configured capacity conflict badges are included. Overlap is a diagnostic of current persisted records, not guaranteed bookability or actual student occupancy. Rows are capped at 500 with truncation warning; pure tests and gated disposable-PostgreSQL read/denial fixtures authored. Runtime and browser acceptance remain open.
**Legacy:** `/college-admin/lecture-halls`

**Read/manage PARTIAL (2026-10-14):** `/college/lecture-halls` uses registered `lecture_halls` with the existing add/edit/archive/restore dialogs and college-scope API writes. Added server-side hall-name, status, room-type and department filtering with 25-row pagination, separate filtered/unfiltered empty messages, loading/error boundaries and dashboard setup navigation. Archived and active halls are included by default. No new write route was introduced; the existing create/PATCH routes enforce `isSameOriginRequest`. The legacy delete semantics (vNext uses archive), detailed room location, complete scheduling-conflict UI, executed new tests and browser parity remain open.

- [ ] Hall list/table fields match.
- [ ] Create Hall form fields/validation match.
- [ ] Edit Hall modal matches.
- [ ] Delete confirmation/dependency conflicts match.
- [ ] Search/filter/pagination match.
- [ ] Capacity/location/identifier semantics match.
- [ ] Schedule-conflict-related data needed by Classes is available.
- [ ] Loading/empty/error states match.

## Page: Electives
**Minimum configured-credit selector PARTIAL (2026-10-15):** Elective slot catalogue and capped CSV now filter by saved slot credits before pagination; bounded numeric input and blank-value handling distinguish unconfigured filters from invalid zero. Unit and isolated PG positive/negative thresholds authored; browser and runtime gates open.

**Elective slot CSV PARTIAL (2026-10-15):** College Admin can export selected current-college slot search/program/status/semester matches with recorded pick limits and offerings, capped at 1,000 rows, formula-neutralized and explicit truncation. The isolated PostgreSQL own/foreign/wrong-role fixture is extended for this endpoint. This does not imply learner selections or finalized enrollment; executed acceptance remains open.

**Semester-scoped elective filter PARTIAL (2026-10-15):** College elective slot catalogue now filters on the persisted semester number (1–24) with route-preserved pagination and strict class/elective filter separation. Isolated PG fixture checks included/excluded terms and still checks foreign-college and wrong-role denials. Executed and browser acceptance, selection finalization remain open.

**Lifecycle PARTIAL (2026-10-14):** College Admin elective slot rows expose confirmation-gated ARCHIVE/RESTORE using strict Zod, same-origin PATCH, college-scoped active role and revalidated persisted actor, integer version CAS and immutable activity audit. Archive is blocked when any active offering or persisted learner selection exists; restore requires a currently active parent program and eligible IST academic period. The registered slot only supports ACTIVE/ARCHIVED; selection FINALIZE was intentionally not invented. Pure-model/unit and disposable PG own/foreign/wrong-role/stale tests authored, unexecuted. Full selection/finalization mechanics, UI/browser acceptance and real PG gates remain open.

**Legacy:** `/college-admin/electives`

**Write-side PARTIAL:** `/college/electives` includes confirmed slot create/edit via same-origin POST/PATCH, own-college program/period checks, versioned update, enrollment-impacting edit guard, atomic audit, unit and gated DB tests. Feature enablement, full offering capacity, learner choice/finalize and exact legacy/browser parity remain open.

**Read-first PARTIAL (2026-10-14):** `/college/electives` now shows registered DB-0037 elective slots with program, term, optional academic year/period, choice constraints, credits, status and counts of active college-owned course offerings. Search, program/status filters, 25-row pagination, loading/error and honest empty states included. Presence of a slot does **not** verify the college feature switch or a learner choice window. Feature-disabled state, creation/editing, selection/enrollment, capacity enforcement, close/finalize, executed DB/browser parity remain open.

- [ ] Feature-disabled state matches ("Electives is turned off for this college").
- [ ] Elective offerings/list match.
- [ ] Create/edit lifecycle and eligibility/selection fields match.
- [ ] Student choice/enrollment management matches.
- [ ] Capacity/selection rules match.
- [ ] Close/finalize actions and confirmations match.
- [ ] Loading/empty/error states match.

## Page: Attendance
**Legacy:** `/college-admin/attendance`

**Department attendance export PARTIAL:** `/college/attendance/departments` now exposes the active college correction policy in read-only form and a server-scoped CSV export of departmental marked-session and explicit status-record counts; formula-like cells are neutralized. These metrics do not imply learner-level attendance percentages. Exact legacy CSV, browser and executed PostgreSQL checks remain open.


**Department-summary read-first PARTIAL (2026-10-14):** `/college/attendance/departments` reports marked scheduled-session counts and explicit attendance status rows by the authenticated college department, using registered session/event/record tables. It cannot derive true attendance percentages, because PRESENT can be implicit and eligible learner/session denominators are not computed. Search, pagination, loading/error and honest no-data states are included. Exact legacy reporting, database runtime and browser acceptance remain open.

Legacy contract audited:
- Attendance Policy card;
- retroactive marking window;
- exam-eligibility threshold;
- Class selector;
- Course selector;
- "only courses taught to this class" vs all college courses;
- month previous/next;
- monthly learner grid;
- per-cell state;
- session chooser modal when multiple sessions/day;
- attendance record modal;
- marked by/at;
- correction: Mark present / Mark absent;
- correction policy;
- CSV export;
- empty/error/prerequisite states.

Implementation note (2026-10-14): `/college/attendance` has a policy card, Class/Course filters and all-college catalogue toggle, monthly grid/day chooser, record drawer, status corrections and escaped CSV export. Existing Faculty-compatible PRESENT-as-no-record semantics and super-admin acting-college scope are retained. These checks remain open pending disposable-PostgreSQL test execution, exact legacy oracle/source comparison, and desktop/mobile browser verification.

- [ ] Attendance policy values are visible/authoritative.
- [ ] Class/Course selectors and class-course narrowing match.
- [ ] Show-all-courses toggle matches.
- [ ] Month navigation matches.
- [ ] Grid semantics/percentages match.
- [ ] Session chooser modal matches.
- [ ] Attendance record modal matches.
- [ ] Marked-by/marked-at audit metadata is shown.
- [ ] Correction window is enforced server-side.
- [ ] Correction actions and confirmations match.
- [ ] CSV export matches.
- [ ] Empty/prerequisite/error/loading states match.

# Courses & Content

**Offering lifecycle PARTIAL (2026-10-14):** The existing offering page supports confirmed path publish/unpublish, denying publish without active lessons and unpublish once learner progress/submissions/attempts are present. Mutation and audit share a transaction; exact legacy behavior and browser/real-PG acceptance are not yet confirmed.

## Page: Courses
**Legacy:** `/college-admin/courses`

**Write-side hardening PARTIAL:** Existing `/college/courses` create/edit/archive remains the operational entrypoint, with same-origin API guards, strict Zod, central `can()`/`courses.manage`, and database locks where needed. Create, edit and archive now record immutable college-scoped activity in the same transaction as their canonical row mutation; editing checks live department ownership under lock, while archive blocks active offerings. Confirmation UI already exists for archive. Existing course catalogue DONE status is not changed; legacy field-by-field and independently executed DB/browser acceptance are still open.

- [ ] Course catalogue table/card fields match.
- [ ] Create Course form/modal matches.
- [ ] Edit Course flow matches.
- [ ] Archive/delete/deactivate consequences match.
- [ ] Search/filter/pagination match.
- [ ] Course detail/deep links match.
- [ ] Duplicate code/name validation matches.
- [ ] Loading/empty/error states match.

## Page: Course Detail / Offering
**Offering metadata PARTIAL (2026-10-14):** College Admin `/college/courses` offers confirmation-gated edit of persisted offering CORE/ELECTIVE type, optional credits and display order. Dedicated same-origin PATCH uses College Admin college scope, row and parent guards, millisecond-truncated optimistic updatedAt comparison, an active-delivery dependency fence for credit/type changes, monotonic write token, and immutable same-transaction audit. Pure-model and isolated PostgreSQL success/foreign/wrong-role/stale/dependency tests authored; executed CI/browser acceptance and exact legacy action parity remain open.

**Legacy:** `/college-admin/courses/[id]`

- [ ] Course identity/metadata sections match.
- [ ] Offering/semester/class associations match.
- [ ] Teaching assignments match.
- [ ] Learning/content summary matches.
- [ ] Edit/lifecycle actions and confirmations match.
- [ ] Access/not-found/error states match.

## Page: Lessons
**Exact course-code lesson catalogue PARTIAL (2026-10-15):** Lessons can now be narrowed by authoritative saved course code, independently from lesson-title text search, with scoped SQL count/pagination, filter-preserving links and capped CSV. Isolated PostgreSQL positive/negative and unit bounds authored; runtime/browser proof remains open.

**Lessons CSV PARTIAL (2026-10-15):** The registered college Lessons catalogue exports bounded filter-matched course/cohort/lesson/path and authored versus published content counts, respecting parent offering lifecycle, 1,000-row cap, formula-neutralized cells and truncation signals. The existing isolated PostgreSQL success/foreign/wrong-role fixture includes export assertions. This is metadata only; file keys and contact details are never selected. Executed/browser and legacy column parity remain open.

**Offering-lifecycle lesson filter PARTIAL (2026-10-15):** Lesson catalogue now separates lesson lifecycle filtering from parent offering lifecycle (ALL/ACTIVE/ARCHIVED), without confusing archived offerings with deleted content. Strict dedicated lesson Zod query, URL paging and tenant-bound PostgreSQL include/exclude fixtures authored. Runtime/database/browser evidence and complete lesson edits remain outstanding.

**Legacy:** `/college-admin/lessons`

**Read-first PARTIAL:** `/college/lessons` lists migrated lessons with course, cohort, academic-period and learning-path context, status filter/search, 25-row pagination and persisted authored/published content counts. Create/edit are available in the existing offering editor and now include transaction-coupled immutable audit. Offering lesson up/down reorder adds a stale-sequence fence, same-origin API, and confirmation. Full bulk drag reorder, exact legacy modals, upload, and browser/PG execution remain open.

- [ ] Aggregate Lessons list/search/filter matches.
- [ ] Course/lesson path context is visible.
- [ ] Create Lesson flow matches.
- [ ] Edit Lesson flow matches.
- [ ] Delete/reorder actions match.
- [ ] Deep link to Course/learning path works.
- [ ] Loading/empty/error states match.

## Page: Video Content
**Video metadata CSV PARTIAL (2026-10-15):** Admins can export a capped, formula-neutralized set of filtered VIDEO/YOUTUBE rows, including persisted course/lesson/audience metadata and publication state, without meeting URLs, storage keys or private notes. Current-college and wrong-role fixture assertions authored; executed PG/browser checks remain open.

**Persisted audience-scope filter PARTIAL (2026-10-15):** Stored video and YouTube metadata share the offering-shared versus section-specific delivery-scope filter, with current-college authorization, linked filters and isolated PostgreSQL fixture. No playback URL/key disclosure and no executed acceptance claimed.

**Mobile catalogue parity PARTIAL (2026-10-15):** The content catalogue now shows self-contained course/lesson/status/scope cards at narrow widths rather than a minimum-800px data table; desktop retains the wide table. A shared pure scope-label model has unit coverage and the existing isolated-PG fixture validates persisted delivery scope. Actual 375px browser verification and full legacy actions remain open.

**Video-type filtering PARTIAL (2026-10-15):** The read-only catalogue supports persisted VIDEO versus YOUTUBE subtype filtering, strict URL parsing, deep-link pagination and a compact responsive select. Existing isolated PG fixture asserts both subtype partitions and same-college privacy. Playback/storage access, executed PG/browser proof and remaining legacy actions are open.

**Content aggregate column collision repair PARTIAL (2026-10-15):** The combined VIDEO/RESOURCE register now aliases joined content, learning-path, offering and college ancestry projection columns uniquely (PostgreSQL 42702), with in-college PG fixture asserting labels/links and non-disclosure of private URLs/keys. Executed PG/browser and media/file workflow acceptance remain outstanding.

**Legacy:** `/college-admin/lesson-content?type=video`

**Read-first PARTIAL (2026-10-14):** `/college/videos` now lists owned, migrated VIDEO/YOUTUBE authoring metadata across offerings, with search/status filters and 25-row pagination. Neither media playback nor signed file authorization is implemented; storage keys and external video URLs are intentionally omitted. The existing offering editor remains the authoring surface. Exact legacy/browser and disposable-DB acceptance remain open.

- [ ] Video aggregate list/filter matches.
- [ ] Create/edit video metadata matches.
- [ ] Schedule/visibility controls match.
- [ ] Upload/provider fields match.
- [ ] Delete/replace consequences match.
- [ ] Signed playback is explicit BLOCKED until storage is live.
- [ ] Loading/empty/error states match.

## Page: Resources
**Resource metadata CSV PARTIAL (2026-10-15):** Own-college RESOURCE authoring metadata can be exported with matching search/status/course/scope filters and 1,000-row cap, spreadsheet-formula neutralization and truncation disclosure. Private text notes, URLs, keys and meeting links are not returned. Tenant and wrong-role PG fixture assertions authored; executed/browser parity remains open.

**Persisted audience-scope filter PARTIAL (2026-10-15):** Resources list can distinguish offering-shared metadata from section-bound records using nullable deliveryId before pagination; a section-specific scope is never inferred. Strict query validation, URL-persisted selector and PG fixture for shared/section exclusion authored; browser/real-DB acceptance remains pending.

**Mobile catalogue parity PARTIAL (2026-10-15):** The content catalogue now shows self-contained course/lesson/status/scope cards at narrow widths rather than a minimum-800px data table; desktop retains the wide table. A shared pure scope-label model has unit coverage and the existing isolated-PG fixture validates persisted delivery scope. Actual 375px browser verification and full legacy actions remain open.

**Course-code filter PARTIAL (2026-10-15):** Registered resource/video catalogue queries now accept an optional exact course-code filter, applied inside the same tenant-fenced JOIN before count and pagination. The responsive filter keeps its value in links; pure-model and disposable-PG fixtures cover invalid/absent matches. Executed PG/browser proof, secure downloads and resource write parity remain open.

**Content aggregate column collision repair PARTIAL (2026-10-15):** The combined VIDEO/RESOURCE register now aliases joined content, learning-path, offering and college ancestry projection columns uniquely (PostgreSQL 42702), with in-college PG fixture asserting labels/links and non-disclosure of private URLs/keys. Executed PG/browser and media/file workflow acceptance remain outstanding.

**Legacy:** `lesson-content?type=resources`

**Read-first PARTIAL (2026-10-14):** `/college/resources` lists migrated RESOURCE authoring metadata by lesson/offering with search/status filters and 25-row pagination, excluding text notes, external URLs, private object paths and signed downloads. The offering workspace remains the editor; exact legacy/browser and disposable-DB acceptance remain open.

- [ ] Resource aggregate list/filter matches.
- [ ] Link/file fields match.
- [ ] Add/edit/remove actions match.
- [ ] File upload/download remains explicit BLOCKED until storage is live.
- [ ] Empty/error states match.

## Page: Live Classes
**IST date-window CSV parity PARTIAL (2026-10-15):** Downloaded live-class schedule metadata now uses the same chosen from/through IST dates as on-screen pagination, without leaking meeting links. Calendar selectors pass through bounded service validation, with owned/absent-date fixture assertions; runtime and browser proof still pending.

**IST day-range scheduling filter PARTIAL (2026-10-15):** Saved LIVE_CLASS content now filters on configured start/end instants overlapping bounded IST-local days, preserving day selectors in paginated URLs. Strict range and tenant-scoped PostgreSQL fixture authored; independent runtime/browser acceptance remains outstanding.

**Live-class schedule CSV PARTIAL (2026-10-15):** A strictly own-college, formula-neutralized 1,000-row Live Classes schedule export lists persisted session/course/lesson metadata and UTC ISO start/end instants; no private meeting URLs or storage keys. The downloaded CSV is explicit about UTC timestamps, unlike the IST UI. PG fixture covers current-college/foreign/wrong-role and secret exclusion; runtime/browser acceptance remains open.

**Course-specific live sessions PARTIAL (2026-10-15):** Admin Live Classes now exposes an exact persisted course-code selector carried into pagination. The underlying join already validates both course department and offering ancestry within the signed-in college; invalid and missing code fixtures are authored. Executed PG/browser proof remains open.

**Upcoming/past persisted session filter PARTIAL (2026-10-15):** Live-class list now filters by actual saved endsAt timestamps before pagination; ongoing counts as upcoming. Null-ended sessions are excluded from both time-filtered views and remain visible under ALL. URL view selector survives pagination, and bounded schema plus isolated PostgreSQL fixture assertions were authored. Runtime and browser acceptance remain outstanding.

**Persisted College Admin live-class catalogue PARTIAL (2026-10-15):** /college/live-classes now renders same-college LIVE_CLASS content with lesson/course links, IST start/end times, search, publication and 25-record pagination. It selects unique named Drizzle columns using the shared alias helper and never selects private meeting URLs or storage keys. Read-only mobile cards, strict URL schema and own/foreign/wrong-role disposable PostgreSQL fixtures authored. Upcoming/past state and editor parity, executed PG/browser gates remain open.

**Legacy:** `lesson-content?type=live-classes`

- [ ] Live-class aggregate list matches.
- [ ] Meeting URL/start/end/schedule fields match.
- [ ] Create/edit/remove actions match.
- [ ] Upcoming/past state matches.
- [ ] Empty/error states match.

## Page: Assignments
**Legacy:** `/college-admin/assignments`

**Read-first aggregate PARTIAL:** `/college/assignments` lists persisted college-owned assignments, with title/status filters, due dates, lesson/course context, submission-row counts, an offering deep link, loading/error/empty states and no assignment or file-storage mutations. Legacy authoring/edit/delete, report and browser parity remain unchecked.

- [ ] Aggregate list/filter/pagination match.
- [ ] Create Assignment fields/validation match.
- [ ] Edit/delete actions match.
- [ ] Due-date/schedule/visibility match.
- [ ] Submission counts/report deep links match where legacy exposes them.
- [ ] File attachment workflow is explicit BLOCKED until storage is live.
- [ ] Loading/empty/error states match.

## Page: Quizzes
**Legacy:** `/college-admin/quizzes`

**Read-first aggregate PARTIAL:** `/college/quizzes` lists persisted college-owned quizzes, with title/status filters, due dates, lesson/course context, attempt-row counts, an offering deep link, loading/error/empty states and no quiz-answer disclosure. Legacy authoring/edit/question/results management and browser parity remain unchecked.

- [ ] Aggregate list/filter/pagination match.
- [ ] Create/Edit Quiz workflow matches.
- [ ] Questions/answers/points/attempts fields match.
- [ ] Schedule/open/close/results-publication controls match.
- [ ] Delete/close confirmation matches.
- [ ] Loading/empty/error states match.

## Page: Course Progress
**Exact recorded-course filter PARTIAL (2026-10-15):** Per-offering content-progress evidence now supports an exact registered course-code selector across paginated UI and formula-safe export; it never computes inferred learner completion or attendance. Existing college/foreign PostgreSQL fixture covers a matching and missing code; runtime/browser evidence open.

**Recorded content activity export PARTIAL (2026-10-15):** The College Admin Course Progress page now exports a max-1,000-row CSV of actual per-offering learner-content records, completed content rows and distinct learners with recorded activity (not eligible learner denominator or course completion). Export is restricted to active own-college admins, formula neutralized and truncation labeled. Isolated PG own/foreign/wrong-role coverage authored, unexecuted.

**Legacy:** `/college-admin/course-progress`

**Read-first PARTIAL:** `/college/course-progress` reports persisted per-offering learner-content activity, completed content records and distinct learners with any progress records. Absent activity displays zero recorded rows, not zero learner completion. Cohort/section eligibility denominators, detailed learner breakdown, completion rate, export, exact legacy and browser parity remain open.

- [ ] Program/course/class filters match.
- [ ] Learner progress table/metrics match.
- [ ] Lesson/content completion breakdown matches.
- [ ] Search/sort/export if present are accounted for.
- [ ] Drill-in behavior matches.
- [ ] Loading/empty/error states match.

# People

## Page: Faculty
**Academic-title profile completeness PARTIAL (2026-10-15):** The Faculty roster filters memberships with and without a nonblank academic title in persisted faculty profiles, before scoped pagination; no title is inferred from teaching duties or employment type. Pure model and gated PG partition/wrong-role fixtures authored; runtime/browser acceptance remains outstanding.
**Query/empty form repair PARTIAL (2026-10-15):** Optional roster selects with empty default values are discarded before strict Zod parsing; pressing Apply without selecting a department/cohort/employment type now uses valid unfiltered defaults. Faculty history query unit coverage added for allowed ALL/ACTIVE/ENDED and scope-forgery rejection. Independently executed tests/browser still pending.
**Teaching-history status filters PARTIAL (2026-10-15):** The Faculty detail page now distinguishes live versus ended course-teaching assignments with SQL filtering before the 100-row history cap. All-time total/active/unique-offering evidence remains unchanged and is separately labeled, and foreign-college members are still not found. Strict detail query model and isolated PostgreSQL active/ended/denial fixtures authored; browser/runtime verification open.
**Employment-type roster filter PARTIAL (2026-10-15):** Faculty directory can filter exact authored employment type on own-college Faculty profile rows before pagination, rather than assuming undocumented FULL_TIME/PART_TIME enums. A bounded list of persisted distinct employment strings is provided, with truncation disclosure; Learner-role selection is rejected. Scoped PG denial and strict query/URL model tests authored, pending execution and browser parity.
**Role-specific active teaching PARTIAL (2026-10-15):** The Faculty directory can filter active teaching by registered PRIMARY, CO_TEACHER or TA course-teaching roles, using the same-college delivery and course joins before pagination. Distinct from staff employment role, and unsupported for Learners. Strict enum, URL, bounded UI and scoped PostgreSQL denial fixtures authored; browser/DB execution and workload parity remain open.
**Scoped faculty-department selector PARTIAL (2026-10-15):** Faculty roster now filters by exact primary department against own-college registered department/profile ancestry before pagination. The dropdown shows up to 200 active own-college departments and explicitly discloses truncation. Unsupported Learner department filters reject, and foreign UUIDs return empty (not existence). Zod/URL and isolated PG tenant/role fixtures authored; exact legacy/browser checks remain open.
**Profile metadata search PARTIAL (2026-10-15):** Faculty name/email directory search now includes authored academic title, employment type and registered own-college department name using correlated FACULTY profile rows. No cross-college or private identity columns are searched; pagination and membership-role restrictions remain unchanged. Pure hint and in-test PG metadata fixtures with role denials authored; runtime/browser parity remains open.
**Role-restricted CSV export PARTIAL (2026-10-15):** Faculty directory links to the canonical college people CSV exporter with FACULTY role fixed and current search/membership status. Teaching/account-status filters are not applied and UI discloses the difference. Unit and existing isolated PG role/tenant coverage extended; detailed legacy roster/browser checks remain open.
**Teaching-presence filter PARTIAL (2026-10-15):** Faculty directory adds server-filtered ASSIGNED/NONE for persisted non-ended teaching assignments on live course deliveries in the admin’s college, before pagination. Counts are assignments, not teaching hours. Own/foreign/wrong-role and URL/model PG fixtures authored; browser evidence and legacy scheduling parity remain open.
**Account-status filter PARTIAL (2026-10-15):** Faculty memberships now filter persisted ACTIVE/DISABLED platform account status independently from membership lifecycle, with strict Zod, URL-persisted pagination and isolated PG role/tenant checks. Browser and legacy profile/edit parity remain open.

**Lifecycle audit link PARTIAL (2026-10-14):** Faculty directory and detail now link to a scoped Activity Log filter using the target membership UUID; server-side subjectId filtering operates after the existing college permission scope, including stable pagination. Lifecycle PATCH remains confirmed and transactionally audited. CSV export deliberately does not inherit subjectId filtering and the UI labels that limitation; full legacy/browser proof remains open.
**Legacy:** `/college-admin/teachers`

**Detail PARTIAL (2026-10-14):** `/college/faculty/[membershipId]` now provides scoped Faculty name, academic title, employment type, department and persisted teaching assignment history with active/ended counts and distinct offerings. No hours or availability are inferred and no private identity fields are disclosed. Foreign-college/nonexistent memberships get indistinguishable not-found behavior. Browser/PG acceptance and full legacy workload parity remain open.

**Read-first PARTIAL:** `/college/faculty` lists persisted Faculty-role college memberships with search, status/pagination, user status, and count of active college-owned teaching assignments. The College Admin shell and dashboard link to it. This is not the legacy faculty onboarding, edit or complete-profile workflow; exact legacy and browser acceptance remain open.

**Lifecycle PARTIAL:** Faculty rows now include a confirmed deactivate/reactivate action. The transaction locks the same-college FACULTY membership, requires the expected status, blocks deactivation while any live course teaching or section faculty assignment remains, and writes the state transition plus immutable actor-scoped activity event. No cross-college lifecycle writes are permitted. Legacy complete profile editing and independent runtime/browser evidence remain open.

- [ ] Faculty list columns/profile metadata match.
- [ ] Search/filter/pagination match.
- [ ] Create/invite Faculty flow matches.
- [ ] Edit Faculty flow matches.
- [ ] Active/inactive lifecycle matches.
- [ ] Profile/detail drawer/page actions match.
- [ ] Loading/empty/error states match.

## Page: Faculty Assignment
**Teaching roster CSV PARTIAL (2026-10-15):** Matching persisted assignments can be exported as a 1,000-row formula-neutralized CSV with role/lifecycle, offering/class and IST-labeled timestamps (UTC ISO evidence is preserved), explicit truncation and no Faculty/learner contacts. Uses the signed-in College Admin roster query with existing tenant/role tests extended to export. Runtime/legacy/browser checks remain outstanding.

**Teaching-role filter PARTIAL (2026-10-15):** Faculty assignments can be narrowed to PRIMARY, CO_TEACHER or TA using the authoritative teaching-role enum and current-college persisted assignments. Model and isolated PG fixtures cover valid/invalid roles and role-specific matches. Executed PG/browser proof and remaining mutation/legacy behavior are not closed.

**Teaching-assignment directory repair PARTIAL (2026-10-15):** Joined assignment/offering, course/class/cohort/period and two independently sourced end timestamps now carry unique subquery column aliases; the isolated-PG fixture checks the correct delivery and active/ended meaning. Atomic reassignment conflict and scheduling acceptance still needs executed PG/browser verification and legacy comparison.


**Reassignment actor safety PARTIAL (2026-10-14):** The transaction now rechecks the persisted acting account, membership and College Admin role under SHARE locks and rejects revoked actors even with a cached active request context. Replacement Faculty account, membership and role are locked through commit; disabled accounts return TARGET_NOT_FOUND. Pure policy coverage and PostgreSQL revocation/no-side-effect fixtures added using a dedicated admin. PostgreSQL execution is blocked in this sandbox by OS user creation/switch restrictions; timetable conflicts, legacy/browser verification and remaining reassignment variants remain open.

**Reassignment timetable guard PARTIAL (2026-10-14):** Reassignment now checks registered future SCHEDULED sessions linked to the target delivery against the replacement Faculty’s explicitly scheduled commitments. Overlap rejects atomically; adjacent sessions and the same session are allowed. More than 2,000 windows fails closed instead of silently accepting a truncated schedule. Unit boundaries and PostgreSQL overlap/no-teaching-change/no-audit plus adjacent-success fixtures added. This does not reinterpret implicit teaching workload or rewrite existing scheduled Faculty; universal scheduling concurrency, legacy/browser proof and PostgreSQL execution remain open.

**Atomic reassignment PARTIAL (2026-10-14):** Active rows on `/college/faculty-assignment` now offer a confirmation-gated replacement Faculty selector. The College Admin service requires same-college live delivery plus active FACULTY membership, an exact old-membership expectation and millisecond-normalized PostgreSQL timestamp token, locks the live delivery/assignment, checks duplicate/primary role policy, ends the old row, inserts one same-role successor and writes immutable audit within one transaction. Foreign/missing assignments return the same NOT_FOUND. Unit and disposable-PostgreSQL success/foreign/wrong-role/stale fixtures authored. Different delivery/role reassignment, timetable workload checks, executed database/browser evidence and legacy dialog parity remain open.

**Legacy:** `/college-admin/faculty-assignment`

**Write-side PARTIAL (2026-10-14):** `/college/faculty-assignment` retains the college-scoped list/search/status/pagination and adds a live course/class delivery + Faculty + role assignment form and end-assignment action. Both require explicit user confirmation. Existing registered `course_teaching_assignments` unique constraints remain the concurrency backstop; the create transaction also checks duplicate faculty/live primary teacher before insert, locks live delivery/membership/Faculty role and writes an immutable actor-scoped `activity_events` audit row. End keeps teaching history and audits in the same transaction. Read-only options filter active same-college deliveries, courses, cohorts/programs, academic periods, section and Faculty account/membership. A maximum 200-option truncation is disclosed; no silent fallback. Change/reassign in one operation, timetable conflict evaluation, exact legacy dialogs and executed DB/browser acceptance remain open.

- [ ] Course/Class/Faculty selectors match.
- [ ] Existing assignment list/table matches.
- [ ] Assign Faculty action matches.
- [ ] Change/reassign/remove actions match.
- [ ] Duplicate/conflict validation matches.
- [ ] Active/inactive assignment state matches.
- [ ] Loading/prerequisite/error states match.

## Page: Students
**Registration-number coverage triage PARTIAL (2026-10-15):** Student roster now filters learners with a nonblank recorded registration number or missing registration data, preserving role/college query scope and server pagination. Distinct from roll number; no inferred identity values. Strict URL/model and disposable PostgreSQL partition/denial tests authored; executed acceptance pending.
**Roll-number coverage triage PARTIAL (2026-10-15):** The learner directory now filters those with nonblank registered roll numbers versus missing values using a correlated learner profile before pagination, retaining college and role scope. No roll number is invented or written; strict query/URL and gated PostgreSQL partition/denial fixtures authored. Executed acceptance outstanding.
**Active batch membership filter PARTIAL (2026-10-15):** College Admin student directory can select one persisted batch/cohort and only see that cohort\u2019s active learner enrollments, checking registered program/dept college ancestry before pagination. The selector reads up to 200 own-college batches, displays program context and discloses truncation. Role/tenant PG and URL/query fixtures authored; browser/DB execution pending.
**Active class placement filter PARTIAL (2026-10-15):** The Student roster can now partition registered learners by presence or absence of a live section enrollment within their own college and active program enrollment before server pagination. It does not reinterpret missing placement as an absence record. Faculty rejects this learner-only query. Model/URL and disposable PG partition/role tests authored; independent execution and mobile acceptance remain.
**CSV case-variant identity deduplication PARTIAL (2026-10-15):** Student CSV import preview and confirmed-import per-row validation now treat email addresses differing only by case as duplicates in the same file before identity provisioning. Phone and row-limit rules remain intact, and no external user lookup is disclosed. Pure parser test authored; identity/DB acceptance and legacy import parity still open.
**Active program/batch search PARTIAL (2026-10-15):** College Admin learner directory can search persisted active program or batch name/code through a correlated, same-college enrollment lookup, alongside name/email and learner identity identifiers. Archived/non-active enrollments are not presented as current. Unit label and disposable PG signed-in college/role checks authored; browser/legacy and full fixture execution remain open.
**Identity-key search PARTIAL (2026-10-15):** The College Admin student directory can search registered learner roll and registration numbers in addition to name/email, using correlated membership-scoped profile predicates before pagination. Faculty searches do not expose learner identifiers. Pure model and disposable PG in-test own-college/denied-role fixtures authored, not executed; mobile/browser and legacy roster parity still open.
**Role-restricted CSV export PARTIAL (2026-10-15):** Students directory now exposes the existing, signed-in-college export with LEARNER role fixed and current name/email and membership-status selectors. Contacts are visible only with College Admin permissions; 1,000-record cap, truncation footer and CSV formula neutralization remain. Enrollment/account-status filters are explicitly *not* reflected in export. Unit and existing isolated PG role/tenant tests extended; browser and legacy report parity remain open.
**Enrollment-presence filter PARTIAL (2026-10-15):** Student directory can distinguish an active college-owned program enrollment from no active enrollment using a correlated registered-table EXISTS predicate *before pagination*. It does not infer missing enrollment as a failed student record. Pure URL/Zod and isolated PG partition/role/tenant tests authored; full legacy moves and browser acceptance remain open.
**Account-status filter PARTIAL (2026-10-15):** Learner memberships now filter persisted ACTIVE/DISABLED platform account status independently from cohort/class context, with the same college-only query, URL-persisted pagination and PG isolation witness. Browser and full learner lifecycle parity remain open.

**Class-move guard PARTIAL (2026-10-14):** Directory move now returns the same non-leaking `STUDENT_NOT_FOUND` code for a foreign or absent membership, resets stale destination selection on reopening, and distinguishes no alternative eligible section. Persisted move remains version-checked, same-cohort and same-period, transactionally audited. Legacy modal/browser acceptance remains outstanding.
**Legacy:** `/college-admin/students`

**Detail PARTIAL (2026-10-14):** `/college/students/[membershipId]` shows in-college learner name, roll/registration numbers, program/cohort, active section and explicitly recorded marked-session attendance statuses. It excludes identity documents and other private profile fields; foreign-college/missing IDs get the same not-found. Attendance denominator intentionally excludes unrecorded present defaults, so this is not an overall attendance rate. Browser and exact legacy drill-in acceptance remain open.

**Read-first PARTIAL:** `/college/students` lists persisted Learner-role college memberships with search, status/pagination, and active program/batch/class information when registered. Missing enrollments are shown explicitly, not inferred. Create/import/edit, academic moves, full-profile detail, exact legacy/browser verification remain open.

**CSV import PARTIAL:** `/college/students/import` accepts bounded CSV (100 learners, 100 KB) with exact headers, per-row Zod validation, duplicate-in-file checks and a dry-run of registered, college-owned program/cohort status. A confirmed import calls the existing canonical person onboarding and learner-enrollment services in sequence, retaining each service audit. Rows report IMPORTED, FAILED, INVALID or PARTIAL (membership created, enrollment failed). The result CSV is formula-neutralized. Identity and PostgreSQL cannot share one ACID transaction, so bulk atomic rollback is not promised; external identity collision and recovery may require manual action. Exact legacy CSV contract, executed write-positive PostgreSQL/browser acceptance and learner profile extras remain open.

**Class-reassignment PARTIAL:** The Students directory offers a confirmed class move only within the learner's active cohort and academic period. The service enforces current placement and active learner guards, a live destination class and period, capacity, stale-state denial, an atomic MOVED/ACTIVE history transition, and an immutable college-scoped activity event. Cross-batch and cross-period transfers, legacy import/edit and browser acceptance are not provided.

- [ ] Learner list/profile metadata match.
- [ ] Search/filter/pagination match.
- [ ] Create/import/add learner flows present in legacy are accounted for.
- [ ] Edit learner fields/lifecycle actions match.
- [ ] Program/batch/class assignment state matches.
- [ ] Profile/detail drill-in matches.
- [ ] Loading/empty/error states match.

## Page: People Directory
**Role-directory ordering PARTIAL (2026-10-15):** Student and Faculty directories now use server-side NAME/NEWEST/OLDEST sort before 25-row pagination, with membership-UUID tie breaking and URL-persisted sort state. This is membership-join chronology, not program admission chronology. Strict query and isolated PG sort/role tests authored; browser/legacy parity remains open.
**Legacy:** `/college-admin/people`

- [ ] Combined role directory fields match.
- [ ] Role/status/search filters match.
- [ ] Person detail/profile action matches.
- [ ] Membership/role/lifecycle actions match College Admin permissions.
- [ ] Loading/empty/error states match.

## Page: Student Groups List
**Legacy:** `/college-admin/student-groups`

**CSV validation PARTIAL (2026-10-14):** For STUDY_GROUP only, `/college/groups/[groupId]/import-preview` reads a bounded email CSV (500 rows, 128 KiB) and reports in-college active learner matches, repeated rows, already-present members, capacity blockers and formula-neutralized validation CSV. This route performs no writes and does not claim confirmed imports or enrollment acceptance. All page checks remain open.

**Write-side PARTIAL:** `/college/groups` now provides Study Group create/edit/activate/close/archive on migrated `lms_groups`, with same-college duplicate-name, version and member/capacity guards. All changes use persisted actor rechecks and transactional `activity_events` audits. Group types with additional semantics (PROJECT_TEAM/ELECTIVE) remain read-only here. Complete legacy dynamic rules, CSV, member moderation and browser acceptance remain open.

Audited contract:
- search toolbar;
- Kind filter;
- Status filter;
- New Group;
- Open;
- status transition dropdown;
- Delete confirmation;
- 20-row pagination.

- [ ] Search/kind/status filters match.
- [ ] Table columns/seat/status data match.
- [ ] New Group modal/form matches.
- [ ] Open route works.
- [ ] Status transition rules match.
- [ ] Delete confirmation preserves members/history as legacy describes.
- [ ] Loading/empty/error states match.

## Page: Student Group Detail

**Waitlist eligibility safety PARTIAL (2026-10-14):** Promotion now locks the learner account, membership and learner role through commit and rejects disabled accounts without changing the seat count, queue row/version or member history. A pure decision model preserves lock, stale-member, FIFO and capacity denials; PostgreSQL fixtures cover disabled-account no-side-effects and stale member tokens. Local type/lint/unit evidence is required before publishing; PostgreSQL remains blocked by sandbox OS user restrictions. Rule refresh, automatic scheduling, legacy/browser proof and remaining waitlist workflows stay open.

**Waitlist and rule writes PARTIAL (2026-10-14):** `/college/groups/[groupId]` now exposes version-checked, confirmed manual promotion of the first unlocked WAITLISTED learner when group capacity permits, and scoped V1 criteria rule editing with a clearly identified autoRefresh setting (saving never executes refresh). Dedicated same-origin PATCH uses the persisted College Admin actor check, own-college STUDY_GROUP lock, integer group/member optimistic versions, exact learner role/capacity/FIFO guards and one atomic membership change plus immutable member event and activity audit. Rule changes validate linked programs/cohorts stay in college and reject unsupported rule versions, then audit atomically. Pure unit and disposable-PostgreSQL success/foreign/wrong-role/stale tests authored. Full rule refresh UI, automatic refresh scheduling, learner consent/queue fairness edge cases, complete legacy/browsers and independently executed database gates remain open; parity stays PARTIAL.


**PARTIAL read-only dynamic rule preview:** College Admin can open `/college/groups/[groupId]/rule-preview` from the group detail for configured supported V1 rules. Shows persisted criteria and a bounded candidate eligibility projection without writing memberships or exposing applicant evidence. No assertion of capacity/waitlist outcome or full college-wide counts above cap. Rule edit/refresh controls, original legacy behavior, PG execution and browser verification remain open.

**Legacy:** `/college-admin/student-groups/[id]`

Audited contract:
- back to groups;
- Edit Group modal;
- status transition;
- summary card: members/term/created/description;
- tabs;
- roster toolbar/filter;
- lock/unlock member decision;
- Remove;
- Remove & Lock;
- Recount;
- Add Students modal;
- identify-by mode + pasted list;
- source/manual-vs-import + note;
- capacity/waitlist result;
- rule fields: branches, passing years, CGPA, backlogs, 10th/12th/diploma/UG %, gap years;
- Save Rule;
- Preview Matches;
- Apply to Roster confirmation;
- Remove Rule confirmation;
- rule preview table;
- history/audit table.

- [ ] Edit Group modal matches.
- [ ] Status transitions match.
- [ ] Summary metadata matches.
- [ ] All detail tabs are represented.
- [ ] Member state filter/search match.
- [ ] Lock/unlock semantics match.
- [ ] Remove and Remove & Lock confirmations match.
- [ ] Recount behavior matches.
- [ ] Add Students modal and parsing/validation match.
- [ ] Capacity/waitlist behavior matches.
- [ ] Eligibility/rule form fields match.
- [ ] Save Rule behavior matches.
- [ ] Preview Matches and counts/table match.
- [ ] Apply Rule confirmation/consequences match.
- [ ] Remove Rule confirmation matches.
- [ ] History/audit tab matches.
- [ ] Archived group is read-only where legacy enforces it.
- [ ] Not-found/cross-college state matches.

# Placements

## Page: Drives
**Legacy:** `/college-admin/jobs`, `/college-admin/jobs/all`

- [ ] Landing/current/all views and filters match.
- [ ] Search/sort/pagination match.
- [ ] Create drive action matches College Admin permission.
- [ ] Status/lifecycle badges match.
- [ ] Needs-attention cues match.
- [ ] Row/card actions and deep links match.
- [ ] Empty/loading/error states match.

## Page: Drive Overview
**Legacy:** `/college-admin/jobs/[jobId]`

- [ ] Job/company/role summary matches.
- [ ] lifecycle/status controls match.
- [ ] KPI/application/round/offer summary matches.
- [ ] publish/close/cancel/edit actions and confirmations match.
- [ ] activity/history summary matches.
- [ ] not-found/access/error states match.

## Page: Applications
**Legacy:** `/college-admin/jobs/[jobId]/applications`

- [ ] Applicant table fields/filters/search match.
- [ ] Eligibility/application status views match.
- [ ] Bulk status actions match.
- [ ] Candidate detail drawer/modal matches.
- [ ] Export if present matches.
- [ ] Empty/error states match.

## Page: Interviews
**Legacy:** `/college-admin/jobs/[jobId]/interviews`

- [ ] Round/interview schedule views match.
- [ ] Add/edit round/interview actions match.
- [ ] Date/time/location/slot fields match.
- [ ] Candidate assignment/result actions match.
- [ ] conflict validation matches.
- [ ] Empty/error states match.

## Page: Shortlisted
**Legacy:** `/college-admin/jobs/[jobId]/shortlisted`

- [ ] Shortlisted candidate list and filters match.
- [ ] Selection/export/next-step actions match.
- [ ] Candidate detail drill-in matches.
- [ ] Empty/error states match.

## Page: Job Settings
**Legacy:** `/college-admin/jobs/[jobId]/settings`

- [ ] Eligibility/rule fields match.
- [ ] application/deadline settings match.
- [ ] lifecycle/visibility settings match.
- [ ] destructive/closing actions require correct confirmation.
- [ ] save validation/unsaved-change behavior match.

## Page: Companies
**Legacy:** `/college-admin/companies`

- [ ] Company list/search/filter matches.
- [ ] Company detail/contact/history data matches.
- [ ] Add/edit company/contact actions match admin permission.
- [ ] Drive links/history match.
- [ ] Loading/empty/error states match.

## Page: Hiring Dashboard
**Legacy:** `/college-admin/hiring-dashboard`

- [ ] headline placement metrics match.
- [ ] funnel/stage metrics match.
- [ ] branch/company/CTC/outcome analytics present in legacy are accounted for.
- [ ] date/season filters match.
- [ ] drill-ins/deep links match.
- [ ] partial-data vs empty states are distinct.

## Placement Cell / TPO
College Admin can act inside TPO in the legacy product.

- [ ] College Admin guest access to TPO respects the same page-level contract in `docs/parity/tpo.md`.
- [ ] Admin-only vs TPO-only actions are explicitly differentiated.
- [ ] No strict-portal redirect blocks intended College Admin TPO access.

# Projects

## Page: Workspaces list
- [ ] List columns/cards/status/mentor/team/template data match.
- [ ] Search/filter/status views match.
- [ ] Create Workspace action matches.
- [ ] Row actions/deep links match.
- [ ] Empty/loading/error states match.

## Page: Create Workspace
- [ ] Template chooser/catalog context matches.
- [ ] project title/team/mentor/dates/cadence fields match.
- [ ] validation and creation consequences match.
- [ ] creation result navigates correctly.
- [ ] no stale template references.

## Page: At Risk
- [ ] Cross-project risk metrics/reasons match.
- [ ] filters/sort match.
- [ ] project/mentor/student drill-ins match.
- [ ] empty/loading/error states.

## Page: Readiness
- [ ] Cross-project readiness criteria/status match.
- [ ] filters/search match.
- [ ] drill-ins match.
- [ ] empty/loading/error states.

## Page: Submissions
- [ ] Cross-project submission queue matches.
- [ ] status/reviewer/team filters match.
- [ ] submission/review detail actions match admin permissions.
- [ ] empty/loading/error states.

## Page: Templates Catalogue
- [ ] assigned template list/metadata/version match.
- [ ] search/filter match.
- [ ] template detail deep link works.
- [ ] College Admin remains read-only where legacy is read-only.

## Page: Template Detail
- [ ] overview/sprints/tasks/resources information matches.
- [ ] version metadata matches.
- [ ] read-only behavior enforced.
- [ ] use-template/create-workspace action matches.

## Page: Project Audit
- [ ] cross-project audit event taxonomy matches.
- [ ] filters/search/time range match.
- [ ] event detail/drill-in matches.
- [ ] empty/error states.

## Page: Reassign Mentor
- [ ] eligible project/mentor selection matches.
- [ ] bulk selection/reassignment workflow matches.
- [ ] preview/confirmation consequences match.
- [ ] partial failure reporting matches.

## Page: Deleted Workspaces
- [ ] Product decision is explicitly made: recreate or RETIRE.
- [ ] If retained, deleted list, restore/permanent-delete actions and confirmations are fully specified.
- [ ] If retired, rationale is recorded in master matrix.

## Workspace section: Summary
- [ ] identity/status/template/team summary matches.
- [ ] archive/delete/status actions match admin permission.
- [ ] confirmation/consequence states match.

## Workspace section: Overview
- [ ] narrative/problem/goals/deliverables/definition-of-done fields match.
- [ ] edit/save validation matches.

## Workspace section: Team
- [ ] team/mentor/member data match.
- [ ] add/remove/reassign actions match.
- [ ] confirmations and protected-member rules match.

## Workspace section: Sprints
- [ ] sprint rows/fields including goal/acceptance/release/date match.
- [ ] create/edit/delete/reorder lifecycle matches.
- [ ] cross-reference integrity with tasks remains safe.

## Workspace section: Tasks
- [ ] task fields/status/type/priority/estimate/sprint linkage match.
- [ ] create/edit/delete/move actions match.
- [ ] cross-reference integrity matches.

## Workspace section: Resources
- [ ] type/title/url/access notes/pinned/required fields match.
- [ ] add/edit/delete match.
- [ ] file uploads remain explicit BLOCKED until storage is live.

## Workspace section: Meetings
- [ ] meeting fields/status/type/date/time/url/linked sprint/task/agenda/notes match.
- [ ] add/edit/cancel/complete actions match.
- [ ] cross-reference integrity matches.

## Workspace section: Readiness
- [ ] criteria/status/notes match.
- [ ] admin overrides/actions present in legacy match.

## Workspace section: Delivery
- [ ] final submission/review/readiness fields match.
- [ ] admin review/override actions match.
- [ ] history/consequence behavior matches.

## Workspace section: Audit
- [ ] project audit/history event coverage matches.
- [ ] actor/time/detail representation matches.
- [ ] filters/empty/error states match.


### W06 College Admin Departments outstanding verification
- [ ] Execute `tests/unit/admin-department-directory.test.ts`; confirm College Admin unauthorized-role redirect and negative cross-college API access.
- [ ] Desktop/mobile browser checks: search, CSV download, refresh after create/edit/archive, modal keyboard interactions, pagination and empty/error states.
- [ ] Verify bookmarked legacy `/college-admin/departments` route behavior and route-map exception.
- [ ] Confirm archive blockers with real DB tests, including concurrent dependency creation.


**W06 legacy department bookmarks, 2026-10-10:** authenticated, role-fenced redirects for `/college-admin/departments` -> `/college/departments` (active college membership with COLLEGE_ADMIN) and `/superadmin/departments` -> `/admin/departments` (active SUPER_ADMIN). This preserves entry URL behavior without duplicating editor logic or weakening current scope checks. `tests/unit/legacy-department-links.test.ts` authored with negative role/disabled status cases; **execution/browser evidence pending**, so the Departments family is still PARTIAL.


### W06 Programs source-authored checkpoint — 2026-10-10
- Distinct daily-use Programs pages added at `/college/programs` and `/admin/programs`, discovered via their Academics overview links. Both reuse existing `listPrograms`/`listDepartments` scoped read services, existing `POST /api/academics/programs` and `ProgramActions` PATCH/DELETE with cohort-dependent archive checks.
- UI implemented: create with department prerequisite, name/code/duration-terms validation, search by program/department/code, case-insensitive sorting, scoped CSV export with formula-injection protection, Refresh, 10-row pagination, Edit and Archive dialogs via existing component.
- **Material legacy mismatch remains:** legacy creates `durationYears` (1–10 years) and offers Department editable in Edit modal; vNext persists `durationTerms` (1–24) and currently has immutable Department ownership. Do not assume 2 terms/year nor silently claim equivalence; W01 must settle DB02 source semantic decision before full page parity.
- [ ] Execute `tests/unit/admin-program-directory.test.ts` plus admin role and wrong-tenant API tests on disposable DB.
- [ ] Browser verify desktop/mobile, tab order, create/edit/archive, search/CSV/refresh, dependent-cohort rejection and independent-page navigation.
- [ ] Legacy `/college-admin/programs` and `/superadmin/programs` bookmark aliases are not yet implemented. Match source-route manifest before closing.

**Status remains PARTIAL; tests authored and not run, no migration or W01 shared schema changes.**


**W06 Programs bookmark alias:** `/college-admin/programs` and `/superadmin/programs` now enter their respective existing scoped Programs page via authenticated, role-fenced redirects. Existing vNext pages and service permissions remain authoritative. Negative role tests authored; run/browser evidence still OPEN.


### W06 People Directory checkpoint — 2026-10-10

**Legacy oracle:** `lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`, `src/pages/superadmin/sections/PeopleDirectory.js` reused by College Admin; backed by `lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`. The legacy People Directory is a **read-only contacts page** with **All Contacts**, **Faculty Contacts**, **Student Contacts** tabs and separate navigation to manage students/faculty/faculty assignments. The current vNext `/college/people` is a membership management table and must **not** be marked as full clone parity.

**Authored W06 UI improvement:** server-side, college-bound People pagination (50 rows/page) replaces a hard-coded first 100; `?page=` back/forward semantics, range/total display and out-of-range reset preserve selected college. Existing permission-checked repository and onboarding/role/lifecycle dialogs remain unchanged. This addresses an operational truncation but **does not implement the three contact tabs**, managed accounts links, search or export.

- [ ] Run `tests/unit/admin-people-pagination.test.ts` and seeded PostgreSQL multi-page tests including cross-college negative checks.
- [ ] Build and browser-verify College Admin page >100 people, scope switching, permission revocation, stale link and mobile pagination.
- [ ] Implement a server-filtered read-only All/Faculty/Student contacts directory, not a misleading client-side filter of 50 rows; preserve management pages separately.
- [ ] Compare legacy contact-card fields/private-field visibility and account-management navigation before closing page.

**Status: PARTIAL / tests authored, not executed.**


### W06 Activity Log date-boundary correction — 2026-10-10

Legacy College Admin audit is college-scoped and calendar-driven; vNext already improves the old first-page-only audit feed with keyset paging and grouped meaningful events. W06 found a date-only correctness bug in vNext: browser `<input type="date">` values such as `2026-10-10` were coerced as UTC midnight, so the `To` filter could exclude almost the entire selected day for India users. The shared activity query now interprets date-only From/To as **00:00:00.000–23:59:59.999 Asia/Kolkata**, while preserving explicitly offset ISO datetimes and rejecting timezone-ambiguous datetimes. The page labels the calendar filters as IST.

Authored regression: `tests/unit/activity-date-boundary.test.ts` covers IST→UTC boundaries, invalid calendar dates, ambiguous timestamps and explicit-offset preservation. **Not executed in this session; browser/DB evidence remains OPEN.** Activity Log stays PARTIAL until taxonomy/producer coverage, detail drill-in, error states and browser checks are verified.


### W06 College Admin announcements staging — 2026-10-10

**Personal college notice read PARTIAL (2026-10-14):** The college announcements page now also shows up to 50 persisted `in_app_notifications` addressed to the active College Admin and tied to activity events within the same college, with an explicit link to the full personal inbox. This does not implement, infer or enable the unregistered DB10 college-wide `announcements` table; no broadcast publication/delivery is claimed. New isolated PostgreSQL read-positive/foreign-recipient/foreign-event/wrong-role checks and pure projection tests are authored. Runtime/browser acceptance remains pending.

A College Admin management workspace is source-authored at `/college/announcements` with server-derived own-college audience targets, create/edit/retarget, schedule/expiry, pin, soft delete/restore, active/deleted views and stable older-page continuation. Cross-college target IDs are resolved and rejected server-side. The page is deliberately inactive until W01 promotes DB10 Announcements; browser evidence is absent, so this is **not a DONE page**.


### W06 Activity detail drill-in — 2026-10-10

The shared Activity Center now has a tenant-safe `/activity/[eventId]` drill-in showing event/action, actor, entity, scope, time and structured context. A College Admin may open only events whose persisted `collegeId` equals the active membership college; an out-of-college UUID is returned as not-found. Metadata is bounded and credential/identity-secret key names are redacted before browser rendering. This advances the "detail drill-in / expandable event context" job, but the page remains PARTIAL because exact legacy category chips, all producer coverage, request IP/User-Agent, actor-role snapshot and executed browser tests remain OPEN.


### W06 source-matched Dashboard quick actions and setup phases (2026-10-10)

Legacy FE `lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`: `college-admin/dashboard.js` + `components/admin/dashboard/config.js` define **11 Quick Actions** and **14 first-time Setup Guide steps** across 5 phases. `/dashboard` now shows these rows only when the current membership carries COLLEGE_ADMIN; existing metrics remain. Each correctly available vNext destination links to its real college-scoped page, while missing exact daily-use jobs (Faculty, Students, Attendance, Assignments, Quizzes, Hiring Dashboard, read-only Contacts tabs, Semesters, Semester-Course Mapping, Batches, Classes, Faculty Assignment, Lecture Halls, Lessons and Lesson Content) remain clearly non-clickable, not falsely mapped to a generic page. This is **visible navigation parity inventory, not completed feature parity**.

- [ ] Implement missing daily-use destinations and turn their non-clickable items into source-backed links one page at a time (coordinate W02 course/assessment, W04 placement UI; W06 owns master/admin pages).
- [ ] Wire Setup Guide progress to real persisted college readiness; current phase cards do not claim completion.
- [ ] Compare AtAGlance and AttentionBoard data/KPIs against legacy and add per-card permission/error/empty/mobile tests.
- [ ] Execute `tests/unit/admin-dashboard-navigation.test.ts`, build/typecheck and authenticated desktop/mobile College Admin browser workflow.

**State: PARTIAL / source-authored navigation only / tests not run.**

## College Admin Department Placement Evidence (read-first PARTIAL)

`/college/placements/readiness-by-department` lists active enrolled learners, recorded candidate-academic-evidence profiles, verified profiles, and placement preference profiles by owning department. It does not assert job eligibility or actual readiness, and is not a replacement for legacy Hiring Analytics. This reports only migrated source evidence with College Admin permission and strict college scope; full funnel reporting, browser and runtime DB acceptance remain open.

**Classes CSV export PARTIAL (2026-10-14):** `/college/classes` reuses existing persisted search/program/status filters, exports up to 1,000 same-college registered sections across server-paged results, neutralizes spreadsheet formulas, and emits CSV footer plus HTTP cap/truncation headers. Auth derives college from context, not query; no private learner data. Pure unit and gated own/foreign-college PostgreSQL tests authored; CI and browser acceptance pending.

**College offering lifecycle PARTIAL (2026-10-14):** College Admin `/college/courses` now includes archived offerings in the list, while create selectors and delivery aggregation exclude archived rows. Confirmed archive reuses the existing transactional delivery guard and immutable audit; restore validates own-college ancestry, current parent statuses and active offering uniqueness, locks and writes audit transactionally. New origin-protected route, Zod/role checks and unit/PG success/foreign/stale tests authored. Browser/PG execution remains pending; no DONE row change.

**Attendance corrections read PARTIAL (2026-10-14):** `/college/attendance/corrections` now displays authorized current college policy, labels saved versus default policy, and lists persisted scheduled sessions for a strict 1–31-day IST window with recorded attendance marking status and existing Faculty correction-window calculation. It explicitly does not infer actual correction requests or totals because a dedicated migrated request-history table is unavailable. Gated PostgreSQL own/foreign/role checks, pure-model unit tests and error/loading/mobile states authored; independent CI/browser verification pending.
