**2026-10-16 chat-9 literal legacy Super Admin copy pass (SOURCE IMPLEMENTED; NOT DONE):** Exact source phrases from docs/audit/legacy-copy-B.md now appear on Super Admin verification ("Students' education and identity, checked against their documents." / "Choose a college at the top to see its students waiting for verification."), Organizations (Create New Organization, Existing Organizations, Name, Create Organization, legacy example), Colleges (Name, Organization, Unique ID, City, State table headers and Create College form labels/examples), and Tenant Setup (Create the customer, then make one college launch-ready; Create an organization and its colleges; Get this college ready to go live). The Tenant Setup hub exposes both explicit create and setup routes, preserving existing authorization and scope. Existing 13-row sidebar, 3 dividers, 6 exact group strips, and legacy /admin/hr alias were retained rather than cloned. Exact-string unit tests added per surface. **Not run:** Vitest, TypeScript, lint, build, PostgreSQL, real browser/mobile, cross-role privacy. Remaining P2: exhaustive buttons, fields, modals and empty/error copy on remaining Super Admin pages and current-published legacy sources; S3 eyebrows/descriptions still require the documented owner choice. Changes are not acceptance certification.

**2026-10-16 chat-9 Super Admin wording/reachability round (SOURCE IMPLEMENTED; NOT DONE):** Existing 13-row legacy sidebar with three dividers and six ordered group strips retained. The /admin/hr legacy URL now inherits Placements → Recruiter accounts, and Audit Findings deep links keep Activity Log highlighted. Exact Super Admin page headings (Overview, Tenant Setup, Feature Controls, Module Access, Tenant Settings, Activity Log, Inbound mail, Profile verification, Recruiter accounts, Announcements) and grouped tab labels are under new literal-string unit regression. Five scope-required subpages (Departments, Programs, Courses, Lessons, Lecture Halls) show legacy Select a college to continue and verbatim dev-branch help text; Lecture Halls capitalization corrected. Activity Log CSV button now shows exact legacy Export. Remaining P2: full interactive QA for each Super Admin page/action, owner-decision deferred removal of extra eyebrows/descriptions, runtime/role-negative and mobile checks. No assumptions of passing CI, unit suite or DB-backed acceptance.

**2026-10-16 chat-9 follow-up — no duplicate Super Admin navigation rewrites:** The Super Admin 13-row sidebar and three dividers, grouped strips, and the owner-approved retained links for Domains (Tenant Setup) and Audit Findings (Activity Log) were present on the latest merged main. Existing `tests/unit/sidebar-tab-href-resolution.test.ts` covers group and sidebar hrefs. This round did not change Super Admin routes, schema or shared shell. Acceptance still requires executing Vitest/typecheck, mobile/browser role negatives and the older Super Admin page-specific parity checklist before marking DONE.

**Super Admin retained secondary path highlighting (2026-10-16; source fix, acceptance open):** Domains inherits Tenant Setup, the Academics overview inherits Academic Setup, and existing interview-detail routes inherit Placements / Interviews without becoming extra tabs. Detailed persisted module-access pages under /admin/features/[collegeId] now select the Module Access sidebar row alone, not Feature Controls simultaneously. The six legacy tab groups retain their exact labels and layout, and source route tests exercise every primary tab. Vitest/tsc/browser/role negative execution remains outstanding.

**Super Admin 13-row legacy sidebar (2026-10-16, source implementation, NOT DONE acceptance):** Once Tenant Setup, Academic Setup, Courses & Content, People, Placements (including Recruiter accounts and Announcements) and Templates-first Projects grouped tabs plus the real Module Access route were committed, the Super Admin sidebar was reduced to the exact 13 legacy labels/order. Group values create exactly three separators after Feature Controls, Inbound mail and People. Deep grouped routes keep the corresponding single sidebar item highlighted. Direct previously flat routes remain reachable through grouped tabs or explicit retained links. Source-focused tests authored, not executed. Multi-role and 375px interactive review pending.

**Super Admin grouped-sidebar orphan prevention (2026-10-16, source stage; acceptance NOT DONE):** Tenant Setup links the existing Domains service page, Academic Setup / Departments links the preexisting Academics overview, and Activity Log links Audit Findings on invalid-filter state; valid Activity Log already links Audit Findings in the shared activity page. All existing Super Admin pages keep their role/scope guards. Six role-based group strips and a dedicated Module Access directory were added ahead of the final 13-row sidebar change. Source tests are authored but not executed; 375px browser, HTTP/role-negative and CI review remain open.

# Super Admin — Detailed Page Parity Spec

Super Admin adds global/org/college scope to the shared academic/course/people/placement/project surfaces and owns platform administration.

Every page requires:
- SUPER_ADMIN role fence;
- deterministic global → organization → college scope behavior;
- no stale data when scope changes;
- destructive actions explicitly show blast radius;
- loading/empty/error/partial-data states;
- executed regression coverage.

# Dashboard

## Page: Overview
**Legacy:** `/superadmin/dashboard`

Legacy quick actions route to Tenant Setup, Feature Controls, Tenant Settings, academic setup, courses/content, people, placements and Projects Templates.

- [ ] Platform-level KPI cards match.
- [ ] College-scoped KPI mode matches after selecting a college.
- [ ] Setup Guide/quick actions match legacy destinations.
- [ ] Scope change refreshes all cards without stale previous-college data.
- [ ] Partial-data errors do not render false zeroes.
- [ ] Global vs scoped labels are explicit.

# Tenant / Platform Administration

## Page: Tenant Setup
**Legacy:** `/superadmin/tenants`

Legacy has two onboarding stages.

### Tab 1 — Create
- Organizations CRUD.
- Colleges CRUD.
- Creating a college selects it and advances into setup.
- Creation disabled while already scoped into a college to prevent wrong-customer writes.

- [ ] Organizations create/edit/list actions match.
- [ ] Colleges create/edit/list actions match.
- [ ] College belongs to selected organization.
- [ ] Newly created college becomes active scope.
- [ ] Scoped mode disables unsafe global creation.
- [ ] Unsaved/error/duplicate states match.

### Tab 2 — Set up
- Readiness Gate.
- Tenant Domains.
- College Branding.
- selected-college badge/context.

- [ ] College selection requirement matches.
- [ ] Readiness Gate is implemented.
- [ ] Domain management is embedded or linked without losing onboarding context.
- [ ] Branding management is embedded or linked without losing context.
- [ ] Setup completion state is visible.

## Page/section: Readiness Gate
- [ ] Required go-live checks match legacy.
- [ ] Each failed check explains remediation.
- [ ] Recheck/refresh behavior matches.
- [ ] Gate never reports ready from stale partial data.
- [ ] College scope is fixed and explicit.

## Page/section: Tenant Domains
Legacy behaviors:
- list addresses;
- add;
- edit;
- DNS ownership verification token/check;
- verified/unverified/last-check result;
- make primary;
- non-primary redirects;
- delete;
- typed confirmation for deleting primary host.

- [ ] Domain list and primary/verification state match.
- [ ] Add Domain form/validation matches.
- [ ] DNS verification modal/instructions/check match.
- [ ] Recheck behavior matches.
- [ ] Make Primary confirmation and redirect consequences match.
- [ ] Edit Domain flow matches.
- [ ] Remove non-primary confirmation matches.
- [ ] Primary-domain typed destructive confirmation matches.
- [ ] Cross-college domain collision is prevented.

## Page/section: College Branding
Legacy fields:
- Logo;
- desktop login background;
- mobile login background;
- brand colour;
- desktop/mobile preview;
- safe replacement: old storage objects deleted only after successful save.

- [ ] Logo upload/replace/remove matches.
- [ ] Desktop background upload/replace/remove matches.
- [ ] Mobile background upload/replace/remove matches.
- [ ] Hex colour validation matches.
- [ ] Desktop/mobile preview mirrors actual login rendering.
- [ ] Save is atomic before stale-file cleanup.
- [ ] Storage work remains explicit BLOCKED until Cloud Storage is live.

## Page: Feature Controls
**Legacy:** `/superadmin/features`

- [ ] College-by-module matrix matches.
- [ ] Module columns/labels match current modules.
- [ ] Global/default vs college override semantics match.
- [ ] Toggle confirmation/blast-radius messaging matches.
- [ ] Bulk/global change actions present in legacy are matched.
- [ ] Loading/error/retry states match.
- [ ] Scope selection does not accidentally mutate another college.

## Page: Module Access
**Legacy:** `/superadmin/module-access`

Legacy contract:
- college required;
- hierarchical scope rows;
- Inherit / On / Off per module;
- locked-above semantics;
- learner counts;
- student override/lock drawer;
- individual student access drawer;
- "Why this student sees what they see" trace.

- [ ] College selection requirement matches.
- [ ] Hierarchy nodes match Department/Program/Batch/Class/Student semantics.
- [ ] Inherit/On/Off semantics match.
- [ ] Ancestor lock prevents forbidden descendant override.
- [ ] Learner counts are correct.
- [ ] Students-with-overrides drawer matches.
- [ ] Per-student override controls match.
- [ ] Per-student lock controls match.
- [ ] Access-trace/explainability drawer matches.
- [ ] Reload/error/empty states match.
- [ ] Effective access calculation is tested across nested scopes.

## Page: Tenant Settings
**Legacy:** `/superadmin/settings`

### Platform & auth group
Legacy keys include base domain, global host, cookie domain, cookie SameSite, Super Admin IP allowlist, OTP attempts/window.

- [ ] Base domain control.
- [ ] Global host control.
- [ ] Auth cookie domain control.
- [ ] Cookie SameSite control.
- [ ] Super Admin IP allowlist.
- [ ] OTP attempt limit.
- [ ] OTP lockout window.
- [ ] Validation prevents settings that would lock out the platform.

### SMS group
- [ ] SMS sender ID.
- [ ] attendance absence template.
- [ ] attendance correction template.
- [ ] placement job-update template.
- [ ] provider/DLT constraints are validated.

### Course & progress group
- [ ] watched threshold.
- [ ] in-progress lower bound.
- [ ] classroom chat poll interval.
- [ ] video progress save interval.

### Attendance group
- [ ] eligibility threshold.
- [ ] correction window.
- [ ] schedule past-booking grace.

### Placements group
- [ ] interview overlap window.
- [ ] interview buffer.
- [ ] interview min/max duration.
- [ ] application rate limit.
- [ ] stale-applied days.
- [ ] closing-soon days.
- [ ] low-conversion threshold.
- [ ] needs-attention sample cap.

### Operational caps
- [ ] bulk-status max.
- [ ] progress bulk ids max.
- [ ] identity JSON size cap.
- [ ] announcement page-size cap.

### Other stored keys
Legacy has Add Setting modal and remove action.

- [ ] Product decision: retain free-form keys or RETIRE with reason.
- [ ] If retained, Add Setting modal validation matches.
- [ ] If retained, remove confirmation matches.
- [ ] Unknown keys cannot override protected deployment secrets.

## Page: Activity Log
**Legacy:** `/superadmin/audit`

- [ ] Global/scoped event taxonomy matches.
- [ ] Actor/entity/action/date/college filters match.
- [ ] Detail drill-in matches.
- [ ] Scope changes requery safely.
- [ ] High-volume pagination/virtualization is usable.
- [ ] Empty/loading/error states match.

## Page: HR Accounts
**Legacy:** `/superadmin/hr`

Legacy contract:
- table: Name, Mobile, Company, Colleges, Status;
- Add HR modal;
- Edit HR modal;
- detail drawer;
- College Access card;
- grant/revoke access;
- status;
- terminate every session/device.

- [ ] Account table/search/filter matches.
- [ ] Add HR modal fields/validation match.
- [ ] Edit HR modal matches.
- [ ] Detail drawer matches.
- [ ] College Access list matches.
- [ ] Grant college access flow matches.
- [ ] Revoke access confirmation and immediate effect match.
- [ ] Account status lifecycle matches.
- [ ] Terminate-all-sessions action/confirmation matches.
- [ ] Duplicate mobile/company/account constraints match.
- [ ] Loading/error states match.

# Shared Academic Setup — Super Admin scope

These user jobs are functionally similar to College Admin; detailed field/action contracts are in `docs/parity/college-admin.md`. The Super Admin version must additionally satisfy the items below on every page.

## Page: Departments
- [ ] College scope selector/context matches.
- [ ] Full Departments create/search/export/edit/delete contract from College Admin is present.
- [ ] Clear/global scope cannot mutate an unintended college.

**W06 2026-10-10 source batch (not browser-verified):** `/admin/departments` now renders the legacy-style existing-departments search, CSV export of filtered rows (formula-injection protected), Refresh, page controls and per-department active Programs/Courses/Faculty counts. Counts are obtained from the existing server resolver after an authorized selected-college list read. Any failed count stays unknown (—), never falsely zero. Current Rename/Archive dialogs and server-side dependency blockers remain in place. Added `tests/unit/admin-department-directory.test.ts`; execution/desktop/mobile/export download still OPEN. The entire full Departments contract remains PARTIAL.


## Page: Programs
- [ ] College scope context matches.
- [ ] Full Program create/dependency/edit/delete contract is present.
- [ ] Scope switch clears stale Department options.

## Page: Semesters
- [ ] College scope context matches.
- [ ] Mandatory Semester Name and full edit/delete contract is present.
- [ ] Scope switch clears stale Programs/Semesters.

## Page: Semester–Course Mapping
- [ ] Full mapping workflow from College Admin is present.
- [ ] Organization/college context is explicit.
- [ ] Course options belong to selected scope.

## Page: Batches
- [ ] Full create/edit/filter/delete/students/move-student contract is present.
- [ ] Student modal cannot show another college after scope change.

## Page: Classes / Sections
- [ ] Full class create/edit/delete/filter contract is present.
- [ ] Recurring session modal is present.
- [ ] Course/Faculty/Hall options are selected-college scoped.

## Page: Batch Promotion
- [ ] Full preview/promote/graduate workflow is present.
- [ ] Scope is fixed throughout preview→commit.

## Page: Lecture Halls
**vNext:** `/admin/lecture-halls` reuses the College Admin manager with an exact selected-college requirement. Room table and create/edit/archive/restore exist, but legacy search/filter and desktop/mobile parity still require comparison and executed evidence. Keep acceptance checks open.
- [ ] Full CRUD/search/filter contract is present.
- [ ] Scheduling conflicts remain selected-college scoped.

## Page: Electives
- [ ] Full College Admin elective workflow is present.
- [ ] Feature/module access state is evaluated for selected college.

## Page: Attendance
- [ ] Full Attendance policy/selectors/grid/session chooser/record/correction/export contract is present.
- [ ] Policy source and class/course data use selected college.

# Shared Courses & Content — Super Admin scope

## Page: Courses
- [ ] Full catalogue/create/edit/lifecycle/search contract is present.
- [ ] Scope switch clears stale courses.

## Page: Course Detail
- [ ] Full course/offering/assignment/content summary contract is present.
- [ ] Selected-college context is explicit.

## Page: Lessons
- [ ] Full aggregate list/create/edit/delete/reorder contract is present.

## Page: Video
- [ ] Full aggregate/edit/schedule contract is present.
- [ ] Signed storage remains explicit BLOCKED.

## Page: Resources
- [ ] Full aggregate/add/edit/remove contract is present.
- [ ] File storage remains explicit BLOCKED.

## Page: Live Classes
- [ ] Full aggregate/schedule/edit/remove contract is present.

## Page: Assignments
- [ ] Full aggregate/create/edit/delete/report contract is present.
- [ ] File attachment remains explicit BLOCKED.

## Page: Quizzes
- [ ] Full aggregate/create/edit/questions/schedule/results lifecycle is present.

## Page: Course Progress
- [ ] Full scoped learner-progress filters/table/drill-in contract is present.

# Shared People — Super Admin scope

## Page: Faculty
- [ ] Full Faculty list/create/edit/lifecycle/detail contract is present.
- [ ] Global/scoped account visibility is correct.

## Page: Faculty Assignment
- [ ] Full Course/Class/Faculty assignment contract is present.
- [ ] Every selector is selected-college scoped.

## Page: Students
- [ ] Full learner list/create/import/edit/lifecycle/detail contract is present.
- [ ] Program/batch/class fields are scoped.

## Page: People Directory
- [ ] Combined role directory matches.
- [ ] Membership/role/lifecycle actions match Super Admin permission.
- [ ] Cross-college/global person identity vs membership is displayed correctly.

# Placements — Super Admin scope

## Page: Drives
- [ ] Current/all drives views, filters/search/status and create/open actions match.
- [ ] Selected college vs global scope behavior is explicit.

## Page: Drive Overview
- [ ] Full job/company/lifecycle/KPI/action contract matches.
- [ ] Scope cannot be changed underneath a mutation without revalidation.

## Page: Applications
- [ ] Applicant filters/table/bulk actions/detail/export match.

## Page: Interviews
- [ ] Round/interview create/edit/schedule/result workflows match.

## Page: Shortlisted
- [ ] Shortlist views/actions/export match.

## Page: Job Settings
- [ ] Eligibility/deadline/lifecycle/destructive settings match.

## Page: Companies
- [ ] Company/contact/history/drive relationship view matches.

## Page: Interview Calendar
- [ ] College selection requirement matches.
- [ ] Interview events and View Applications deep link match.
- [ ] Empty/no-scope/error states match.

## Page: Hiring Dashboard
- [ ] Headline/funnel/branch/company/CTC/outcome metrics match.
- [ ] Season/college filters match.
- [ ] Partial-data states do not look like zero.

# Projects — Templates

## Page: Templates list
- [ ] Template columns/cards/status/version/college-assignment counts match.
- [ ] Search/filter/status views match.
- [ ] New Template action matches.
- [ ] Publish/archive actions present in legacy are matched.
- [ ] Empty/loading/error states match.

## Page: New Template
- [ ] Template metadata fields match.
- [ ] Sprints editor fields match.
- [ ] Tasks editor fields match.
- [ ] Resources editor fields match.
- [ ] cross-reference key materialization is safe.
- [ ] validation prevents duplicate/dangling keys.
- [ ] Save/Publish result and navigation match.

## Template section: Overview
- [ ] metadata/status/version summary matches.
- [ ] edit/publish/archive/revise actions match.
- [ ] destructive/lifecycle confirmations match.

## Template section: Sprints
- [ ] Key/title/due label/goal/release key/release title/definition-of-done fields match.
- [ ] add/edit/delete/reorder match.
- [ ] key generation and duplicate prevention match.

## Template section: Tasks
- [ ] Key/priority/title/sprint/estimate/type/due/description/acceptance/approach fields match.
- [ ] add/edit/delete/reorder match.
- [ ] sprint linkage survives key generation/rename/delete.

## Template section: Resources
- [ ] Key/type/title/url/access notes/description/pinned/required match.
- [ ] add/edit/delete/reorder match.

## Template section: Colleges
- [ ] Assigned colleges list matches.
- [ ] Assign College flow matches.
- [ ] Revoke assignment confirmation matches.
- [ ] version/assignment semantics are correct.

## Template section: Versions
- [ ] version history fields match.
- [ ] active/published/current version semantics match.
- [ ] revise/create-new-version workflow matches.
- [ ] older version detail is read-only where appropriate.

# Projects — Operations

## Page: Workspaces
- [ ] Full College Admin list/create/open/status contract is present at Super Admin scope.
- [ ] global/scoped filtering is explicit.

## Page: At Risk
- [ ] cross-project risk metrics/reasons/filter/drill-ins match.

## Page: Readiness
- [ ] cross-project readiness queue/filter/drill-ins match.

## Page: Submissions
- [ ] cross-project submission/review queue/filter/detail matches.

## Page: Project Audit
- [ ] event taxonomy/filter/detail/global-scope behavior matches.

## Page: Reassign Mentor
- [ ] bulk project/mentor selection, preview and confirmation match.
- [ ] college boundaries are preserved.

## Page: Deleted Workspaces
- [ ] Product decision: recreate or RETIRE.
- [ ] If retained, restore/permanent-delete confirmation behavior is specified.

## Workspace: Summary
- [ ] identity/status/template/team summary and archive/delete/status actions match.

## Workspace: Overview
- [ ] narrative/goals/deliverables/definition-of-done fields and save behavior match.

## Workspace: Team
- [ ] team/mentor/member actions and confirmations match.

## Workspace: Sprints
- [ ] full workspace sprint field/editor contract matches.
- [ ] real Release picker behavior matches.

## Workspace: Tasks
- [ ] full workspace task field/editor contract matches.
- [ ] sprint linkage integrity matches.

## Workspace: Resources
- [ ] full resource contract matches.
- [ ] file storage remains explicit BLOCKED.

## Workspace: Meetings
- [ ] full meeting field/lifecycle/linkage contract matches.

## Workspace: Readiness
- [ ] readiness criteria/status/admin actions match.

## Workspace: Delivery
- [ ] final submission/review/override/history behavior matches.

## Workspace: Audit
- [ ] project event history/actor/time/detail/filter behavior matches.


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


### W06 Super Admin People Directory checkpoint — 2026-10-10

The existing `/admin/people` list previously fetched only `limit=100, offset=0`. W06 authored shared server-side 50-row pagination with a selected-college-only query, scoped previous/next links, row ranges and stale-page clamping; it does not grant extra access or modify shared identity persistence. The legacy Super Admin `/superadmin/people` is a read-only People Directory with All/Faculty/Student contacts tabs and separate management destinations (`src/pages/superadmin/sections/PeopleDirectory.js`), **not** a generic membership manager, so this is a technical pagination fix only, not final UI parity.

- [ ] Run authored pure pager unit test and seeded Postgres/browser checks for 125+ records, multiple colleges, scoped link back/forward and role transitions.
- [ ] Implement the legacy contacts tabs and safe personal-contact presentation without exposing secrets; verify global/organization/college scope switch behavior.
- [ ] Confirm management navigation and distinct Students / Faculty / Faculty Assignment jobs; W01 owns identity/backend privilege policy.

**Status: PARTIAL, not VERIFIED.**


### W06 Activity Center calendar-boundary correction — 2026-10-10

The shared Super Admin/College Admin Activity Center now treats date-only From/To query values as full **Asia/Kolkata** days rather than UTC-midnight instants; explicit offset-aware datetimes remain exact and ambiguous timezone-less datetimes fail validation. This prevents a selected `To` date from hiding events later that day in India. Unit regression authored at `tests/unit/activity-date-boundary.test.ts`; **not executed**. This does not close the broader Super Admin activity/audit parity rows.


### W06 Super Admin announcements staging — 2026-10-10

A Super Admin announcement workspace is source-authored at `/admin/announcements`. Listing honors global→organization→college admin safety scope; creation requires a selected college because concrete audience options must be tenant-resolved. Retargeting re-authorizes both old and new scopes. Migration/runtime/browser gates remain OPEN; no completion claim.


### W06 Activity detail and scope drill-in — 2026-10-10

Super Admin Activity Center now links to a detail route that enforces current selected college/organization safety scope; a scoped admin cannot enumerate an event outside that scope by UUID. Global Super Admin may inspect global/all-tenant events. Structured metadata is sanitized before browser rendering. Legacy actor-type snapshot, request IP and User-Agent remain explicit DB10 persistence gaps; tests are authored but not executed, so no audit row/page is VERIFIED.


### W06 Super Admin landing clarification (2026-10-10)

Legacy FE `lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`: `superadmin/sections/Dashboard.js` explicitly **removed** the old full college setup checklist from Super Admin and retained a global welcome/links state (Tenant Setup, Feature Controls, Activity Log), while a selected college shows AtAGlance. W06 renders a compact global link group only when a college is not selected, keeping Tenant Setup and Feature Controls **unavailable** until their exact legacy workflows exist; Activity Log links to the existing privileged `/activity` surface. Selected scope labels are now resolved by matching selected IDs rather than naively using the first list row.

- [ ] Implement exact Tenant Setup and Feature Controls routes and workflows and enable corresponding links.
- [ ] Replace scoped KPI/AtAGlance partials with source-matched metrics and browser verification of scope switch.
- [ ] Execute `tests/unit/admin-dashboard-navigation.test.ts`, typecheck/build and Super Admin no-scope/org-scope/college-scope browser tests.

**State: PARTIAL, not full dashboard parity or verified.**


**2026-10-14 Chat 6 / scoped Super Admin template reads — PARTIAL:** Introduced centralized `project-template.read` for active Super Admin regardless of selected org/college, while `project-template.manage` remains unscoped-only. Template catalogue/detail/subview reads now work in either scope and the catalogue hides global create actions while scoped. Authored pure permission and isolated PG fixture tests (not executed) cover global/college reads, wrong role and mutation denial. Remaining: browser verification of all Overview/Versions/Sprints/Tasks/Resources/Colleges tabs and selected college assignment controls, source legacy parity, actual PostgreSQL execution and UI acceptance.

**2026-10-14 Chat 6 / Super Admin Companies read-first — PARTIAL:** New /admin/companies mobile-friendly read-only company/college-relationship cards, validated query/status filters, admin org/college scope, 200-row disclosed cap, and links from Placements. No private recruiter contact, owner membership or sharing defaults are selected. Added pure projection unit and isolated PG fixture tests (authored, unexecuted) for own/foreign college and wrong role. Remaining: full CRM tabs and edit flows, cross-org UI verification, cursor pagination and exact legacy columns, browser/PG execution.

**2026-10-14 Chat 6 / Super Admin Elective Slots read-first — PARTIAL:** New /admin/electives with selected-college-only read (no implicit membership fallback), persisted program-linked slot status/term/credits/pick counts, strict search/status filters, 200-row disclosed cap, empty/loading/error/mobile cards and navigation from Academics. Authored isolated PG in-test slot/foreign-college/wrong-role tests and unit tests (unexecuted). Remaining: learner picks, offerings/capacity, modals/edit flows, legacy full filters and pagination, run DB/browser gates and cross-role privacy review.

**2026-10-14 Chat 6 / Super Admin Lessons read-first — PARTIAL:** Added /admin/lessons, explicit college scope, persisted course/learning-path/lesson read reused safely from College Admin with a separate centrally authorized Super Admin read path (not a membership bypass for writes). Search/status filter, per-page authored/published content counts, 25-row pagination and mobile cards; loading/error, pure model unit and isolated PG in-test fixture test authored, not executed. Remains: lesson creation/edit/order, content detail and files, exact legacy UI, runtime PG and browser acceptance, privacy cross-role checks.


**2026-10-14 Chat 6 / Super Admin Course Progress read-first — PARTIAL:** New /admin/course-progress with explicit college-scope read, persisted content-progress rows by offering, completed content-record counts and non-additive per-offering learner counts; strict search/status/page, mobile cards, empty/loading/error. Uses existing shared read-only service, no learner progress mutation. Authored pure model/unit and isolated PG in-test offering tests (not executed). Remaining: actual learner-progress-positive fixtures/browser runtime, exact legacy filters/details/export, eligibility denominators, performance and privacy review.


**2026-10-14 Chat 6 / Super Admin Assignments read-first — PARTIAL:** New /admin/assignments, tenant-selected read-only assessment rows using a dedicated centrally authorized Super Admin read path within shared query service, search/status/page validation, counts of submitted records on the displayed page, responsive cards, empty/loading/error, and Courses navigation. No grading or submission content exposed. Authored unit and isolated PG in-test course/lesson/assignment fixtures with cross-college and wrong-role denial (not executed). Remaining: exact legacy authoring/review, exports/detail, filters, executed PG/browser validation, performance checks.


**2026-10-14 Chat 6 / Super Admin Quizzes read-first — PARTIAL:** New /admin/quizzes with explicit college-scope read using shared scope-safe read-only assessment service, search and draft/published/closed/archived statuses, page-level attempt counts, 25-row pagination, mobile cards and loading/error/empty states. Pure unit and isolated PG in-test quiz with cross-college and wrong-role denial authored, unexecuted. Remaining: exact legacy quiz builder/detail, score/report drill-ins, grading and learner workflows, runtime tests/browser acceptance, CSV and larger-scale performance.


**2026-10-14 Chat 6 / Super Admin Batch Promotion preview read-first — PARTIAL:** Added /admin/batch-promotion explicit selected-college context, persisted program/cohort selection, academic year override, no-write blocker/learner preview and capped mobile learner cards. Shared preview service now accepts active Super Admin college-scoped `academics.read`; the separate execute service still requires active College Admin membership, so no promotion write privilege is granted. Pure model/unit and in-test isolated PG success/foreign-scope/wrong-role tests authored, not executed. Remains: exact legacy multi-cohort promotion UX, execution/confirmation parity, school-year policies, full learner lists, browser and PostgreSQL gates, independent readiness audit.


**2026-10-14 Chat 6 template scope action guard — PARTIAL:** Scoped Super Admins no longer see global-only Publish/Unpublish/Duplicate/Archive controls on template detail; selected-college assignment controls remain. Server mutation fences unchanged. Unit permission assertion authored but execution/browser verification remain open.


**2026-10-14 Chat 6 / Platform tenant directory/detail — PARTIAL:** New /admin/tenants active-college directory (query/organization filters, 20-row paging, mobile cards), /admin/colleges/[collegeId] read-only scoped detail and setup links. Uses authorized listColleges/listOrganizations; non-leaking COLLEGE_NOT_FOUND for inaccessible IDs. Pure unit plus isolated PG in-test success/foreign-scope/wrong-role tests authored, unexecuted. Remaining: onboarding Create/Set up tabs, archived tenants, lifecycle management, scope switch browser verification, test execution.


**2026-10-14 Chat 6 / Super Admin User & Role Directory — PARTIAL:** Added /admin/people/directory, global/org/college-safe persisted memberships, role and ACTIVE|DISABLED platform filters, membership-status/name filters, 30-row server paging, mobile cards and IST timestamps. Contact data and unassigned global identities are deliberately not selected. Existing /admin/people edit controls unchanged. Authored strict query unit + disposable PG fixture success/foreign college/wrong role tests (unexecuted). Remains: legacy People Directory tabs, global user identities without memberships, detail and session actions, browser/DB gates.


**2026-10-14 Chat 6 / Super Admin Activity Log export — PARTIAL:** /admin/audit reuses Activity Center filtering (module, importance, actor UUID, event/subject type, IST from/to) and detail drill-ins. Added privileged /api/activity/admin-export with 1,000-row capped cursor iteration, dynamic admin-scope authorization, BOM UTF-8 CSV and formula-neutralization of every text cell; timestamps formatted IST and no actor email/phone columns. Pure unit and disposable PG in-test event/foreign-college/wrong-role denial tests authored, not executed. Remaining: legacy action/entity search UI and audit taxonomy, full pagination/browser/export acceptance and runtime gates.


**2026-10-14 Chat 6 / Project Templates catalogue — PARTIAL:** Added global template title/status filters, 20-row server pagination, responsive cards and active college-assignment counts scoped to current Super Admin global/org/college safety selection. Global mutation/create remains unscoped-only; selected scope keeps read-only template metadata. Pure model + isolated PostgreSQL in-test template/assignment/foreign-count/wrong-role tests authored, unexecuted. Remaining: legacy editor sections, assignment workflows, versions/revision UX, large-volume browser and DB gates.


**2026-10-14 Chat 6 / Template assignment scoped detail — PARTIAL:** Fixed global-template detail and Colleges subview to restrict active assignment IDs/counts/names by selected college AND organization at the SQL level. Global reads retain global counts. Assignment and version timestamps display IST. Added pure scope-model tests and isolated PG in-test template assignment/foreign-college/wrong-role tests (not run). Remains: legacy assignment UX and browser/database acceptance.


**2026-10-14 Chat 6 / Tenant Setup stages — PARTIAL:** /admin/tenants/setup implements explicit Create and Set up navigation; reuses existing authorized organization/college creation forms while disabling creation in selected-college scope. Set up uses server-selected college readiness and links to the existing readiness gate, tenant domains, branding without changing scope. Unknown checks never become ready. Pure model and isolated PG in-test tenant readiness/foreign-scope/wrong-role denial tests authored (unexecuted). Remaining: automatic scope selection on newly created college, precise legacy modal/unsaved behavior, status-refresh browser gates.


**2026-10-14 Chat 6 / Activity entity and college filters — PARTIAL:** Super Admin Activity Center now exposes college selector (only authorized active colleges) plus exact Subject ID filter; both persist through cursor pagination and the capped IST CSV download. Caller-supplied college ID is validated by the existing central activity scope resolver, rejecting forged foreign scopes; export request schema rejects organization/scope override and malformed filters. Unit and isolated PG fixture denial expectations updated, unexecuted. Remaining: dedicated actor/name search and taxonomy-specific UI, browser/performance acceptance.


**2026-10-14 Chat 6 / People tabs and scoped contacts — PARTIAL:** Added All/Faculty/Students contact-view tabs with persisted role filter and stable pagination. SQL returns NULL for email and phone outside explicitly selected-college Super Admin scope; in-scope contacts are permitted, with no CSV exposure. Unit and PG in-test success/foreign-scope/wrong-role tests extended to cover tabs and global masked vs scoped contact (unexecuted). Remaining: legacy contact/detail drawer, lifecycle actions and browser/PG gates.


**2026-10-14 Chat 6 / Super Admin dashboard quick actions — PARTIAL:** Reactivated existing global Tenant Setup, Feature Controls, and Activity Log routes, replacing old disabled placeholder links; selected-college dashboard now offers separate 6-card action grid with only established /admin destinations. Does not restore the deliberately retired full college setup checklist. Existing role/scoped count service unchanged; authored pure navigation unit plus isolated PG tenant/wrong-role fixtures (not executed). Remaining: exact legacy layout, browser/mobile verification and dashboard KPI parity.


**2026-10-14 Chat 6 / Feature Controls mobile matrix — PARTIAL:** /admin/features now renders each selected-college module decision as a compact card below desktop width; no forced 50rem-wide table on mobile. Keeps existing server-authored optional-module resolution, source-default versus persisted rule provenance, locked-state labels, search, scope safety and pagination. Desktop table stays at lg; all mutation/toggle gaps remain. Pure model/unit and in-test PG own/foreign/wrong-role tests authored, not executed; browser no-horizontal-scroll acceptance pending.


**2026-10-14 Chat 6 / Module Access hierarchy mobile — PARTIAL:** Selected college Feature Controls detail now presents global/organization/college inheritance and paginated descendant override rows as mobile-first cards, with desktop table retained only at lg. Derived source-backed summary counts from visible override rows, without representing them as effective student entitlements. Existing authenticated college scope and learner trace semantics unchanged. Pure unit and isolated PG in-test own/foreign/wrong-role tests authored; tsc/lint/DB/browser unexecuted. Remaining: full editing/lock workflows and exact legacy interaction parity.


**2026-10-14 Chat 6 / People Directory filter-tab continuation — PARTIAL:** Unscoped /admin/people now links to global Users & Roles read-only directory while keeping college-specific mutation actions scoped. All/Faculty/Students selection survives GET filtering via server-rendered hidden tab control; explicit role filter disabled when role locked by tab. Unit query/tab model and isolated PG faculty+disabled-learner fixtures with own/foreign/wrong-role checks authored (not executed). Remaining: legacy directory bulk/detail actions and browser accessibility acceptance.


**2026-10-14 Chat 6 / User membership detail — PARTIAL:** Added /admin/people/directory/[membershipId] read-only detail with membership roles, platform/membership status and IST lifecycle dates. SQL filters exact membership by selected organization/college before retrieval. Foreign and nonexistent IDs return identical not-found; contacts null-projected in global/org scope and unmasked only in the exact selected college. Pure unit and isolated PG fixture success, foreign and wrong-role tests authored, not executed. Remaining: lifecycle actions and browser/DB acceptance.

**2026-10-14 Chat 6 / Work Mode repair — PARTIAL:** Merged latest main without conflicts; repaired mismatched JSX conditional endings in Create/Archive template dialogs. Assessment summary helper now accepts only its consumed fields, removing unsafe unit fixture casts. npm ci, full TypeScript and changed-file ESLint passed; full unit suite executed (510 files / 2,010 tests). PostgreSQL package installed outside the repository, but sandbox denied chown and runuser required to start PostgreSQL as non-root. Remaining: executable PostgreSQL and desktop/mobile browser acceptance; no parity closure claimed.

**2026-10-14 Chat 6 / Historical template comparison — PARTIAL:** Versions now link to a read-only historical snapshot and field comparison (title, summary, overview, releases, sprints, tasks, resources). Object property order is ignored; array order and content edits remain meaningful. Version UUID must belong to the requested template; foreign and absent version UUIDs return the same error. Reads work in global and selected-college scope. Added pure unit and disposable PG fixtures for revised snapshots, foreign version and wrong-role denial. Remaining: rollback/lifecycle snapshot parity, pagination, executable PG and desktop/mobile browser acceptance. Legacy reference: lms2-fe prod-2026 Versions source blob 8ff2bb3b6f565d7fa6473cc22b24bb686da8d4ef.

**2026-10-14 Chat 6 / Template college availability — PARTIAL:** Colleges tab now lists authorized active assigned and unassigned colleges, with name/code search, assignment filter, clamped 20-row pagination, pinned version and IST assignment date. Responsive cards reuse the existing centrally fenced assignment API; revocation now requires explicit confirmation and explains pinned-workspace preservation. Active assignments remain revocable when the template is no longer published. Pure model/unit and isolated PG fixture success, foreign-scope hiding and wrong-role checks added. Remaining: legacy bulk assignment, archived colleges, optimistic write tokens, executable PG and browser/mobile acceptance; no DONE rows changed.

**2026-10-14 Chat 6 / Paginated immutable template history — PARTIAL:** Versions tab now reads a maximum of 25 version snapshots per database query, with stable version ordering, total count and clamped previous/next links. Current version is independently resolved so current/published badges remain correct on older pages. History service returns no assignment identifiers in any scope; strict query validation rejects scope overrides. Pure pager unit and isolated PG fixture with 26 revisions, scoped read, absent-template and wrong-role checks added. Remaining: rollback/lifecycle parity, executable PG, concurrent revision and browser/mobile verification. Overview and snapshot comparison still use the existing full detail service; their large-history optimization remains open.

**2026-10-14 Chat 6 / Users without college memberships — PARTIAL:** Added global-only /admin/people/unassigned, linked from unscoped Users & Roles, to inspect identities absent from every college membership (ended memberships still count as assigned). Server authorization denies organization/college scope and wrong role; no email, phone, identity-provider or session columns selected. Strict name/status/system-role filters, database-capped 30-row paging with stale-page clamping, responsive cards and loading/error/empty states. Pure unit and isolated PG in-test active/disabled/system-role/ended-membership fixtures, foreign-scope and wrong-role denial added. Remaining: legacy account lifecycle/detail/session actions, executable PG and browser verification. This is platform administration, not contact-directory parity closure.

**2026-10-14 Chat 6 / Combined template availability scope — PARTIAL:** Refreshed main without conflicts and added a final organization AND college filter to college availability, including unassigned rows. A mismatched selected organization/college pair returns no college metadata instead of relying on a shared list helper's college precedence. Pure model and disposable PG regression authored. Removed seven unused imports in existing lane-touched read services without behavior changes. Remaining: PostgreSQL execution and browser acceptance. No master matrix edits or DONE transitions.

**2026-10-15 Chat 6 / Audit actor and entity text search — PARTIAL:** Super Admin Activity Log now supports bounded actor-name and event/entity text search across summary, subject label/ID/type and event type. Filters remain conjunctive with authorization scope and exact filters, persist through cursor links and apply to the capped formula-neutralized CSV. Wildcards are escaped for literal substring search; no contact search added. Pure filter/pattern unit and disposable PG actor/event fixtures cover own-scope results, literal matching, foreign-scope and wrong-role denial. Remaining: search performance, exact legacy taxonomy/layout, PostgreSQL and browser execution. Scratch restoration included a real git merge of main, preserving orchestrator SQL alias repairs. PostgreSQL user creation was attempted but useradd failed at the sandbox audit interface; setpriv also refused UID switching.

**2026-10-15 Chat 6 / Draft template metadata editor — PARTIAL:** Unscoped Super Admin can edit title/summary with a mandatory change note and confirmation. Creates an immutable next version preserving the blueprint, within a locked transaction and immutable audit. Version plus SQL millisecond timestamp guards reject stale writes before no-op/lifecycle checks. Published/archived templates remain read-only in this editor; scope and wrong-role failures occur before lookup. Strict same-origin PATCH, inline error/pending states, pure model/unit and disposable PG fixture covering success, foreign-scope non-leaking denial, wrong role, stale replay, snapshot/audit and published guard. Remaining: full blueprint editors, publish/archive CAS on existing endpoints, rollback/lifecycle parity, PostgreSQL and browser execution.

**2026-10-15 Chat 6 / Archived tenant directory and detail — PARTIAL:** Tenant directory now supports ACTIVE (unchanged default), ARCHIVED and ALL college lifecycle filters, with SQL-capped 20-row paging, clamped bookmarks and explicit organization/college status. Detail reads archived tenant identity within the exact organization AND college safety scope; foreign and absent UUIDs share not-found. Setup links are withheld when either entity is archived. Every colliding joined column in the derived read table has a unique SQL alias and decoder. Pure unit and disposable PG fixtures cover active/archived reads, mapped columns, foreign-scope non-leaking denial and wrong role. Remaining: archived organization selector, restore/lifecycle writes, exact legacy UI, PostgreSQL and browser execution.

**2026-10-15 Chat 6 / Users & Roles scope and pagination — PARTIAL:** Directory now enforces organization AND college selection together, retaining main's unique Drizzle SQL aliases and contact projection. Count is resolved before offset selection so stale bookmarks clamp to the last matching page (or page 1 for empty results). Page validation now supports the planned 200,000-membership global directory instead of stopping at 30,000 records; reads remain 30 rows per query. Pure pager/URL unit and disposable PG 32-user fixtures cover last-page role filtering, mapped IDs, empty results, foreign/mismatched scope hiding and wrong role. Remaining: keyset pagination/performance at scale, lifecycle/session/detail actions, PostgreSQL and browser execution.

**2026-10-15 Chat 6 / Tenant directory filtered CSV — PARTIAL:** Added same-scope lifecycle/search/organization CSV export, with a 1,000-row DB cap, stable name/ID ordering, BOM UTF-8, IST dates and formula-neutralization of every text column. Contacts are never selected. Duplicate filters and page/scope override keys are rejected. UI includes pending/error download states; truncated output is disclosed in headers and a CSV footer. Pure CSV/filter/cap unit and disposable PG own/archived fixtures cover matched filters, foreign-scope non-leaking denial and wrong role. Remaining: large-volume/browser download checks, PostgreSQL execution and full tenant workflow parity.


**2026-10-15 Chat 6 / section detail unknown-ID 404 — PARTIAL:** `/admin/academics/sections/[sectionId]` preflights validated section UUID against selected college/organization, maps absent and foreign-scoped details to the same 404, and denies wrong roles through central permission policy. Pure scope and disposable-Postgres fixture tests authored; not executed. Full classes UI parity/browser acceptance remains open.


**2026-10-15 Chat 6 / course-offering detail unknown-ID 404 — PARTIAL:** `/admin/courses/offerings/[offeringId]` preflights Zod UUID and exact Super Admin selected-college/org visibility, renders not-found for malformed, missing, archived or foreign offering resources while central authorization rejects wrong roles. Pure guard and disposable PG fixture regressions authored, not executed; authoring and legacy course detail parity remain open.


**2026-10-15 Chat 6 / template overview detail missing-ID handling — PARTIAL:** `/admin/projects/templates/[templateId]` validates UUID and translates PROJECT_TEMPLATE_NOT_FOUND to a route 404 (preserving other errors), for global and scoped template reads. Regression unit and in-test persisted PG fixture authored, not executed; full overview editing and browser parity remain open.


**2026-10-15 Chat 6 / audit filter route validation — PARTIAL:** `/admin/audit` now applies strict Zod URL validation, handles blank inputs safely, enforces paired cursor and correct IST date ranges, rejects arrays/unrecognized params without a 500, and keeps an explicit Super Admin-only entry fence. Authored pure model and disposable PG audit-scope tests (not executed). Exact legacy filters, browser/mobile and high-volume acceptance remain open.


**2026-10-15 Chat 6 / Users & Roles privacy-safe export — PARTIAL:** Added GET /api/admin/people/export and a directory download control with strict role, tab, name, and status filters; 500-record cap, formula-neutralized CSV, no contact fields under any scope, explicit truncated-result marker and client error state. Uses centrally authorized directory service. Pure model and in-test persisted PG fixture tests authored but not executed; pagination consistency and desktop/mobile acceptance remain open.


**2026-10-15 Chat 6 / Super Admin Videos read-first — PARTIAL:** Added `/admin/videos` with selected-college-only persisted VIDEO/YOUTUBE lesson content, validated search/status/page filters, bounded 25-row pages, IST metadata, safe Offering drill-in and responsive loading/error/empty cards; no storage keys, signed downloads or meeting URLs exposed. Authored pure model and isolated PostgreSQL in-test VIDEO/RESOURCE fixture tests for success, foreign-scope concealment, wrong-role; not executed. Also fixed Users CSV UI href construction to ignore list pagination. Remaining: actual PG/browser checks, edit/schedule/upload controls, legacy video parity and privacy review.


**2026-10-15 Chat 6 / Super Admin Resources read-first — PARTIAL:** Added `/admin/resources` with selected-college-only persisted RESOURCE lesson content, strict title/lesson/course search, status/page filtering, 25-row source pagination, safe offering links and responsive error/empty/loading states. The read projection deliberately excludes storage keys, external URLs and contact data; it does not offer a file download or unapproved mutation. Pure unit and disposable PG tests with VIDEO negative fixture, foreign-scope and wrong-role denial authored, not executed. Legacy create/edit/remove, file signed-URL flows, PG/browser privacy and mobile acceptance remain open.


**2026-10-15 Chat 6 / Super Admin Live Classes read-first — PARTIAL:** Added `/admin/live-classes` through selected-college-only persisted LIVE_CLASS lesson records with valid search/status/page filters, 25-record pagination, human-readable IST schedule, mobile cards and loading/error/empty states. Course/offering navigation is scoped, and private join links are withheld. Unit and disposable PG in-test fixture tests authored for live-vs-resource separation, explicit IST timestamps, foreign-scope concealment and wrong-role denial; not executed. Legacy scheduling/edit/cancel UX, conflict checks, actual PG/browser and accessibility acceptance remain open.


**2026-10-15 chat-6 round 3 / Semesters — PARTIAL:** `/admin/semesters` presents selected-college read-only registered program terms with search, active/inactive filter, 25-row pagination, mobile cards, loading/error/empty states and no cross-college fallback. New pure query tests and disposable PG in-test term fixture including wrong-role and foreign-scope denial authored (not executed). Also repaired the stale section-detail unit import identifier to match the exported helper. Full semester edit/create parity and browser acceptance still outstanding.


**2026-10-15 chat-6 round 3 / Batches — PARTIAL:** `/admin/batches` now has explicit selected-college read-only registered cohorts, program/start period, name/code search, lifecycle filter, 25-row paging, mobile cards, empty/error/loading and no cross-scope fallback. Pure model plus in-test disposable PG fixture including foreign-scope/wrong-role denial authored, not executed. Promotion/edit/student transfer and browser acceptance remain open.


**2026-10-15 chat-6 round 3 / Classes — PARTIAL:** New `/admin/classes` read-first persisted sections with search, active/archived filter, capacity, program/cohort/period, 25-row stable pagination, scoped section detail links and mobile-first states. No mutation permissions added. Unit and disposable PG class fixtures for own, foreign and wrong-role cases authored, unexecuted; create/edit/delete/recurring modal and browser checks remain.


**2026-10-15 chat-6 round 3 / Semester–Course Mapping — PARTIAL:** `/admin/semester-courses` read-first maps persisted program-term course records, joins both course and program departments to the exact selected college, exposes search, term active/inactive status and 25-row pagination with mobile/error/empty states. No assumption that numbered terms equal offering academic periods. Pure and disposable PostgreSQL fixture with foreign/wrong-role assertions authored, not executed; mapping writes, full legacy selectors and browser parity remain open.


**2026-10-15 chat-6 round 3 / Faculty Assignment — PARTIAL:** `/admin/faculty-assignment` read-first persisted teaching assignments, joined course, section, program and faculty membership to exact selected college; search, active/ended lifecycle, IST start, bounded 25-row cards, loading/error/empty/mobile states. No reassignment write privileges. Unit and disposable PG in-test fixture foreign/wrong-role assertions authored, unexecuted; atomic reassignment, selector UI and legacy parity still open.


**2026-10-15 chat-6 round 3 / Faculty — PARTIAL:** `/admin/faculty` distinct read-first selected-college faculty memberships with search/status/25-row paging, IST join date, safe membership detail and no phone/email fields. Central people.manage, exact selected college and organization SQL predicates, role membership join. Pure tests and in-test PG user/faculty fixture success, foreign-scope and wrong-role assertions authored, unexecuted. Management/import/edit and browser parity remain open.


**2026-10-15 chat-6 round 3 / Students — PARTIAL:** `/admin/students` distinct read-first selected-college learner membership page, uses central people.manage and SQL-selected organization/college role membership, search/status, 25-row paging, IST dates, mobile and safe membership detail. No email/phone selected. Pure tests and disposable PG in-test learner fixture with faculty exclusion, foreign-college denial and wrong-role tests authored, unexecuted. Import/transfer, academic roster and full legacy detail parity remain open.


**2026-10-15 chat-6 round 3 / Placement Applications — PARTIAL:** `/admin/placements/applications` read-first SQL joins placement job, role option and applicant membership, requiring all to match selected college/org. Search, SUBMITTED/WITHDRAWN, paginated mobile cards and IST submitted date are present. No private contact or screening comments projected, no invented shortlist/selection state, navigation to scoped job detail. Pure unit and disposable PostgreSQL job/role/application fixture with wrong-role/foreign-college assertions authored, unexecuted. Legacy bulk actions, candidate detail/export and browser parity remain open.


**2026-10-15 chat-6 round 3 / Faculty Assignment follow-up — PARTIAL:** Self-review aliased both duplicated joined `ended_at` columns in the read subquery (PG 42702 guard), removed unused import, and extended in-test PG fixture to cover actual ended transition and ACTIVE/ENDED filters. Runtime tests still not executed; no DONE claim.


**2026-10-15 chat-6 round 4 / Placement Interviews — PARTIAL:** Added `/admin/placements/interviews`: scope-fenced 25-row persisted interview/round view with PENDING/SCHEDULED/COMPLETED/CANCELLED, search, IST schedule, safe job links, mobile-first loading/empty/error. No meeting URL, candidate comments or TPO write access. Pure query unit test authored; full round action parity and executable PostgreSQL/browser acceptance remain open.


**2026-10-15 chat-6 round 4 / Placement Shortlisted — PARTIAL:** `/admin/placements/shortlisted` has read-only, persisted SHORTLISTED screening outcomes, selected-college joined applicant/job/membership, safe search and application status paging, IST decision date, responsive error/empty/loading; strips screening internalReason, candidate contact and recruiter notes. Pure query tests authored. Bulk shortlist/export, details and PG/browser acceptance remain open.


**2026-10-15 chat-6 round 4 / Placement Job Settings — PARTIAL:** Added `/admin/placements/job-settings`, read-only job lifecycle/deadline and persisted optional eligibility rules (minimum CGPA, backlog/gap and missing-evidence policy), including explicit missing-policy states. Search/status/paging, safe job link, IST, mobile states, central selected-college authorization; no mutation or candidate private data. Pure unit test authored. Complete eligibility editor and PG/browser gates remain open.


**2026-10-15 chat-6 round 4 / Hiring Dashboard — PARTIAL:** `/admin/placements/hiring` now uses real job-level application counts (submitted/withdrawn) from selected-college jobs and same-college learner memberships, 25-row status/search paging and mobile/error/empty states; explicitly does not represent per-application counts as distinct students, placements or interview conversion. No fabricated zero on query failures. Pure pagination/status unit authored; full season funnel/CTC/branch outcome metrics and PG/browser validation remain open.


**2026-10-15 chat-6 round 4 / Placement Offers oversight — PARTIAL:** Added `/admin/placements/offers`, read-only persisted offer versions, ISSUED/ACCEPTED/DECLINED/WITHDRAWN, INR compensation, joining date and expiry, IST issue, selected-college job/applicant membership and organization joins, search, 25-row cards and safe job link. No recruiter/TPO writes or evidence keys. Pure query tests authored; PG/browser gates, full offers action/detail parity remain open.


**2026-10-15 chat-6 round 4 / Joining Outcomes oversight — PARTIAL:** `/admin/placements/joining` read-only persisted offer joining-outcome rows with PENDING/JOINED/DID_NOT_JOIN/DEFERRED, joining date/IST recorded date, applicant/job search and 25-row pagination. Explicitly excludes missing records from pending and hides internal reason/contact; exact college/org joins, mobile loading/error states. Pure unit authored; mutations, history/detail, PG/browser acceptance remain open.


**2026-10-15 chat-6 round 4 / Placement Seasons — PARTIAL:** `/admin/placements/seasons` selected-college persisted placement-season name/code, registered start/end dates, ACTIVE/CLOSED lifecycle with IST close time, strict search/status, 25-row paging and responsive loading/empty/error. No default/global scope leak or season mutation. Pure unit authored; season config/closeout management, PostgreSQL and browser acceptance open.


**2026-10-15 chat-6 round 4 / Placement Screening Queue — PARTIAL:** Added `/admin/placements/screenings`, read-only PENDING/HOLD/REJECTED screening state in selected college, search, pagination, IST decisions, safe job deep links and private-notes masking; separate SHORTLISTED view. Added eight-route mobile-wrapping oversight navigation on Placements entry page. Pure query unit authored, PostgreSQL/browser checks unexecuted. Decision actions, exports and exact legacy parity remain open.


**2026-10-15 chat-6 round 4 / Read-first oversight verification — PARTIAL:** Added an isolated PostgreSQL in-test CLOSED placement season fixture with explicit UUID/text raw parameter casts to prevent ambiguous inferred parameter type, cross-college/org non-leaking empty result and wrong-role denial; corrected placements-navigation JSX indentation. Authored, not executed; the full 8-route PostgreSQL, lint, TypeScript and 375px browser gates still require orchestration run. Prior unrelated test repairs remain main-owned.


**2026-10-15 chat-6 round 5 / Application detail — PARTIAL:** Added `/admin/placements/applications/[applicationId]` read-only drill-in with exact selected-college/org SQL guards, UUID validation, non-leaking 404 for absent/foreign IDs, course role/job/eligibility/lifecycle dates (IST), and directory deep links. Contact and screening notes deliberately withheld. Pure UUID/time unit tests authored; PG/browser acceptance and legacy actions remain open.


**2026-10-15 chat-6 round 5 / Interview round detail — PARTIAL:** New `/admin/placements/interviews/[roundId]` with UUID-validated exact college/organization join, 404 for unknown/foreign rounds, persisted kind/sequence/schedule/status/duration/results-due in IST, no meeting link/venue or recruiter commentary; directory now drills into this route. Pure ID/IST unit authored; mutating interview scheduling and PG/browser acceptance remain open.


**2026-10-15 chat-6 round 5 / Offer detail — PARTIAL:** Added `/admin/placements/offers/[offerId]` for scoped, versioned offer lifecycle (issue/respond/withdraw dates IST, joining date, INR CTC). Directory deep-links to offer, and view links to applicant application. Both job and membership are SQL-college fenced with org, UUID/foreign/absent → non-leaking 404; no evidence/private contact. Pure ID/date tests authored, PG and browser acceptance remain.


**2026-10-15 chat-6 round 5 / Joining outcome detail — PARTIAL:** Added `/admin/placements/joining/[offerId]` backed by actual persisted joining outcome, linked accepted offer and exact scoped applicant/job/organization. Displays status, joining/recorded dates, offer state and safe offer deep link; excludes private reason. Invalid, foreign or absent outcome returns 404, not synthetic PENDING. Unit model tests authored; history/mutation and PG/browser parity remain.


**2026-10-15 chat-6 round 5 / Placement season detail — PARTIAL:** Added `/admin/placements/seasons/[seasonId]`, selected-college+organization SQL-filtered season detail with registered dates, lifecycle, IST created/updated/closed, UUID validation and unknown/foreign 404. Season directory deep-links and safe back navigation. No season mutation/closeout or implied cross-college season. Pure ID/date tests authored; DB/browser gates remain.


**2026-10-15 chat-6 round 5 / Job Settings detail — PARTIAL:** Added `/admin/placements/job-settings/[jobId]` as read-only persisted eligibility/deadline detail; exact selected-college/org SQL guard and 404 for unknown/foreign job UUID. Distinguishes absent policy vs unrestricted fields, includes past/active backlog, CGPA, gap, allowed program/cohort count (no identity leakage), missing evidence handling and IST update. Directory deep-linked; unit authored, full editor and PG/browser acceptance remain.


**2026-10-15 chat-6 round 5 / Shortlisted detail — PARTIAL:** Added `/admin/placements/shortlisted/[applicationId]` requiring actual persisted SHORTLISTED screening and exact job/role/applicant membership college/org match; wrong status, unknown UUID and foreign scope return same 404. Displays application status, channel, IST submission/decision dates and safe application link, no internal comments/contact. Directory deep-link, pure ID/date unit authored; actions, PG and browser parity open.


**2026-10-15 chat-6 round 5 / Screening Queue detail — PARTIAL:** Added `/admin/placements/screenings/[applicationId]` with exact selected-college/org membership and job guard, PENDING/HOLD/REJECTED persisted screening statuses, application eligibility/channel/IST decision and submission dates. UUID malformed/foreign/missing or a now-shortlisted record returns non-leaking 404; internalReason and candidate contacts excluded. Directory deep-link and pure ID/date tests authored; decision writes/PG/browser parity still open.


**2026-10-15 chat-6 round 6 / Faculty CSV — PARTIAL:** Added filtered selected-college FACULTY membership CSV through the existing scoped people service, strict q/status URL with rejection of organization/college/page overrides and duplicate params, 250-row cap/truncation notice, formula-neutralized CSV and privacy-safe contact-free projection, linked download/error state. Model/unit tests authored; execution/browser and full faculty lifecycle parity remain open.


**2026-10-15 chat-6 round 6 / Students CSV — PARTIAL:** Added `/api/admin/students/export` and in-page filtered CSV download, using the existing authorized selected-college directory service and search/status rules. Role-restricted LEARNER records only; no email or phone. Strict URL rejects organization/college/page override and repeated keys; 250 records maximum, truncation notice, formula-safe UTF-8 CSV, no-store response, error/pending UI. Pure query unit tests authored, execution/browser and full legacy operations parity open.


**2026-10-15 chat-6 round 6 / Batches CSV — PARTIAL:** Added `/api/admin/batches/export` and in-page filtered CSV download, using the existing authorized selected-college directory service and search/status. Persisted batch, program, start period and lifecycle; no cross-college cohorts. Strict URL rejects organization/college/page override and repeated keys; 250 records maximum, truncation notice, formula-safe UTF-8 CSV, no-store response, error/pending UI. Pure query unit tests authored, execution/browser and full legacy operations parity open.


**2026-10-15 chat-6 round 6 / Classes CSV — PARTIAL:** Added `/api/admin/classes/export` and in-page filtered CSV download using the selected-college classes service, exact cohort/program/department/period scope checks and status filters. Registered class, cohort, academic period, class code and capacity from the selected college only. Strict URL rejects caller college/org/page override and duplicates; cap 250, formula-neutralized CSV, truncation notice, no-cache response and pending/error UI. Unit authored; PostgreSQL/browser and legacy class editing parity open.


**2026-10-15 chat-6 round 6 / Semesters CSV — PARTIAL:** Added `/api/admin/semesters/export` and status/search-matched download for selected-college program semesters, with registered names, term number and credits, CSV formula-neutralization and 250-row bounded truncation disclosure. Strict request rejects duplicated params, explicit tenant/college/page override and unsupported statuses; authorized scoped-read service and pending/error UI reused. Unit authored; PostgreSQL/browser and full semester editing parity open.


**2026-10-15 chat-6 round 6 / Semester–Course Mapping CSV — PARTIAL:** Added `/api/admin/semester-courses/export` and in-page filtered CSV download; mapping records use the authorized selected-college SQL joins for program AND course department, term state, course code, mapping credits/type. Strict filters forbid tenant/college/page override and duplicates. CSV capped to 250 with truncation footer and formula neutralization, no-store and pending/error states. Unit authored; mapping write UI and PG/browser parity remain open.


**2026-10-15 chat-6 round 6 / Faculty Assignment CSV — PARTIAL:** Added `/api/admin/faculty-assignment/export` plus in-page filtered CSV on persisted teaching assignments; exact college-scoped course/section/faculty joins and active/ended state already enforced by the read service. Search/status retained and caller org/college/page/repeated filters rejected. Contact-free projection, 250-row bounded cap, formula-neutralized export and truncation footer, no-store, client pending/error. Unit authored; reassignment workflow and PostgreSQL/browser acceptance open.


**2026-10-15 chat-6 round 6 / Placement Applications CSV — PARTIAL:** Added `/api/admin/placements/applications/export` and in-page filtered CSV download for exact selected-college applicant/job/role/membership records, SUBMITTED/WITHDRAWN plus search. Persisted applications, role/job and membership within the same college; no private contact, screening internals or invented shortlist state. Formula-protected UTF-8 CSV, 250-row cap and explicit truncation footer; strict parser refuses college/organization/page overrides or duplicate filter keys, no-store/private response and client pending/error. Pure model unit authored; full applicant export parity, execution and browser acceptance remain open.


**2026-10-15 Chat 6 / Recruiter Accounts rename — PARTIAL:** Added `/admin/recruiters` as a thin alias to the existing scope-authorized `/admin/hr` workspace, updated the Super Admin sidebar, visible recruiter account labels and list paging/reset links without changing `/api/admin/hr` routes. Authored `tests/unit/super-admin-recruiter-navigation.test.ts` for Super Admin versus ordinary/disabled navigation. Legacy alias, mobile behavior, authenticated browser execution, PostgreSQL success/foreign-scope/wrong-role fixture tests and the underlying complete HR account acceptance checklist remain open; do not mark the broader page DONE.

**2026-10-15 Chat 6 / Profile Verification entry — PARTIAL, blocked on shared workspace:** Added `/admin/verification` that requires an explicit selected college and displays an informational choose-college state otherwise. Added fail-closed `/admin/colleges/[collegeId]/verification`: resolves a tenant in the selected authorization scope and requires centralized `profile-verification.review` before showing a clearly unavailable workspace state. The real shared `src/components/verification` and `src/modules/verification` staff queue, drawer, signed document access, bulk review, scoped fixture tests, and browser acceptance await chat-9's shared implementation. **No verification action is implemented or claimed complete.**

**2026-10-15 Chat 6 / Announcements navigation — PARTIAL:** Added Super Admin sidebar link to the pre-existing `/admin/announcements` workspace; its DB readiness gate still blocks live operations pending migrations. DEV-ONLY 42-to-colleges targeting/pin/link/show-until and authorization/PG/browser verification remain open.


**2026-10-15 Chat 6 / backlog follow-up — PARTIAL, source-authored only:** Merged current main (including chat-9 verification UI), then replaced the Super Admin per-college verification placeholder with the shared `VerificationWorkspace` in an explicit error/disabled state. Authenticates and resolves the persisted selected-college tenant before requiring centralized `profile-verification.review`. The staff queue DB read, evidence links, drawer, decisions, send-back, notification outbox, and PG/browser tests are still OPEN; it MUST NOT display an empty queue as if requests were absent.

Added strict pure-model boundaries and accompanying authored unit tests for inbound-mail list/detail, company aliases and web domains, selected-college sign-in methods, reserved subdomain choices, audit-finding filters/priority, platform 42-to-colleges broadcast audience, and non-destructive placement feature toggling. These modules intentionally implement no persistence, authorization bypass, outbound send, webhook, migration, or fake success state. They are foundations, **not completed operational pages**. All table creation or data migration remains owner-managed. Full functional implementations of inbound mail, company curation, college sign-in/subdomain, audit findings board, broadcast all/selected colleges, and both under-scoped audit rows remain OPEN.

The authored unit tests, TypeScript, lint, isolated PostgreSQL in-test fixtures (success, foreign-scope non-leaking denial and wrong role), and 375px browser checks have NOT been executed here. Keep every Super Admin affected page marked PARTIAL until the orchestrator verifies the full flows.


### 2026-10-15 Chat 6 follow-on lane — PARTIAL (pending executable gates)

- **Shell regression:** Updated `tests/unit/shell-model.test.ts` alongside Super Admin-only Recruiter Accounts, Announcements, Verification, Inbound Mail and Audit Findings navigation. Learner/Faculty/Mentor/TPO/College Admin navigation remains unchanged in this lane; explicit TPO negative assertions added. The previous orchestrator shell-calendar test failure is not claimed fixed until gates run.
- **Verification:** Added active-college Tenant Setup link with UUID/status checking to `/admin/colleges/[collegeId]/verification`; that route already mounts chat-9's shared visual workspace but deliberately reports unavailable queue data and disables review. Staff queue storage, signed evidence, review/outbox, PG and browser gates remain OPEN.
- **Recruiter Accounts:** Introduced small-screen account cards retaining View/Edit and preserving the desktop table. Requires measured 375px acceptance; legacy `/admin/hr` and account APIs remain.
- **Announcements:** Existing expiry input now says Show until. Stored HTTPS links in announcement plain text expose a validated external-resource action without HTML rendering. This does NOT implement a first-class link field, all-college targeting, a platform broadcast sender, or notification fan-out. Staged `src/modules/announcements/staged-schema.ts` and `docs/proposed-migrations/platform-broadcasts.sql` for owner approval; no `drizzle/` changes.
- **Inbound Mail:** Added global-only read service, explicit `to_regclass` readiness check, strict status/query paging and role/scope denial tests. `/admin/inbound-mail` shows responsive cards and a read-only plain-text drawer, with honest migration-unavailable/loading/error states. Staged schema/SQL live under `src/modules/inbound-mail/staged-schema.ts` and `docs/proposed-migrations/inbound-mail-messages.sql`. Webhook, mailbox ownership mapping, retention, statuses mutations and PG fixtures remain OPEN.
- **Company Curation:** `/admin/companies` now derives only tentative duplicate company candidates from normalized website hostnames and **already scoped** company relationship rows. No cross-college merge, verify, alias/domain mutations or private CRM exposure. The 200-row cap is disclosed as incomplete evidence.
- **College sign-in/Web address:** `/admin/colleges/[collegeId]/subdomain` reuses authorized existing domain manager; `/signin` reads only a staged policy table when it exists and otherwise shows unknown/unconfigured state. Linked both in active tenant setup. Proposed `college-signin-methods.sql` is not registered; NO authentication behavior or credential preference is changed. Domain moves between colleges remain unresolved.
- **Audit Findings:** Added migration-gated `/tracker/audit-findings` backed by the existing selected-scope tracker issue read service, matching real tracker enums/cursor validation and read-only issue drill-in. No fictitious independent audit findings database. Browser and PG fixture coverage outstanding.
- **Feature Controls:** Disabled Placements now shows a non-destructive policy explanation, with explicit caveat that downstream enforcement remains unverified. No new toggles or changes to the central authorization implementation.

Auth, scope and storage tests included where appropriate are **authored, not executed**. No integration/database/browser gates were run here. Global inbound mail and broadcast schema require owner-reviewed migration and authorization before production. All corresponding parity entries remain **PARTIAL**, not DONE.


### 2026-10-15 chat-6 round 7 — scoped Super Admin follow-up (PARTIAL; not accepted)

- **Profile Verification — PARTIAL:** The Super Admin college route now uses a server-backed selected-college queue, shared DB04 verification records and 25-row filtered workspace. A new scope helper checks active SUPER_ADMIN, exact selected college, persisted tenant existence/status and profile-verification.review on the selected resource. Shared drawer now supports selected-college detail, receipt-validated signed documents and same-origin Verify/Send Back using the existing audited transactional review writer. Scoped CSV reuses formula-neutralized export and rejects duplicate keys. Disposable PG fixture includes own/foreign learner, wrong-role, wrong-selected-college and disabled-user checks. OPEN: executed gates, bulk verify/send-back/message, full notification acceptance, 5,000-row cap refinement, focus/accessibility and 375px browser checks.
- **Tenant Setup Set up stage — PARTIAL:** New /admin/tenants/setup presents seven selected-college navigation steps (branding, sign-in, domains, academics, people, modules, readiness) plus an explicit unselected-college state. Tenant detail links to it only when the college is selected. Navigation is not a completion/readiness verdict and never changes a policy. OPEN: onboarding completion states, auto-selection, cross-tenant PG/browser acceptance.
- **Module Access student overrides/locks — PARTIAL:** The selected learner access trace now distinguishes actual stored membership override On/Off/Inherit, lock and winner/ignored indicators from the effective source resolver result. Placements below-college rules are explicitly ignored, not claimed operative. OPEN: permissioned audited editing, concurrency, history, PG and mobile acceptance.
- **Shared UI regressions — PARTIAL:** The verification drawer and CSV control accept an admin API base without changing default College Admin endpoints. Removed an effect-time setState reset in the shared drawer. Pure and disposable PG tests were authored but NOT run. No role, TypeScript, lint, DB or browser gates were executed here; do not mark these matrix rows DONE.

### 2026-10-15 chat-6 round 7 — additional distinct parity rows (PARTIAL)

- **Organizations onboarding CRUD — PARTIAL:** Responsive small-screen cards now render each scoped organization, creation date and existing authorized edit/archive actions. Desktop table remains intact. Creation sequencing, selected-org flow, 375px measured acceptance and PG role/tenant denials remain unverified.
- **Colleges onboarding CRUD — PARTIAL:** Mobile cards show college name/code/location, tenant setup, readiness, and the existing edit/archive actions. The desktop table is retained. Full Create-stage parity, scoped mutation/browser acceptance and mobile execution remain open.
- **Readiness Gate — PARTIAL:** Failed or unknown persisted-data checks now link to relevant established setup routes. The verified-primary-domain check goes to the exact selected college's web address manager; helper/unit coverage was authored. These links do not change PASS/FAIL/UNKNOWN evaluation or assert actual login readiness. Real-DB/browser and exact legacy check certification remain open.

### 2026-10-15 chat-6 round 7 — platform operations cross-row work (PARTIAL)

- **Overview — PARTIAL:** The selected-college Super Admin dashboard now links to scoped Profile Verification and Audit Findings. Existing College Admin dashboard and navigation arrays were not modified. KPI source parity and 375px browser acceptance remain open.
- **Activity Log — PARTIAL:** Super Admin activity route now exposes a role-specific link to the separate audit findings board; College Admin sees no new action. Event grouping/exports remain sourced from their existing services. Exact legacy event semantics and browser/PG checks remain open.
- **College Branding — PARTIAL:** Authorized preview adds navigation to college overview and, only when the college matches the selected admin safety scope, the web-address verification manager. It explicitly distinguishes stored preview evidence from actual sign-in appearance. Image upload/edit/desktop/mobile acceptance remains open.
- **Platform & auth settings — PARTIAL:** Added read-only /admin/settings/auth posture checklist linked from Platform Settings. Shows privileged MFA requirement, tenant-host isolation, session/CSRF, privileged network restrictions and OTP-source evidence as deployment-managed or runtime-unverified, never falsely enabled. No auth source/config, secret, environment, signing key or cookie logic was changed. Auth settings editing and verified enforcement remain MISSING.
- **Organizations / Colleges / Readiness mobile actions — PARTIAL:** Both onboarding lists now have responsive cards preserving current scoped management actions. Failed/unknown Readiness checks link to established setup pages, with the host check pointing to the exact selected-college domain manager. Source-authored helper tests, PostgreSQL, lint, typecheck and browser acceptance still require orchestrator verification.


### 2026-10-15 chat-6 round 8 — MISSING-first Super Admin increments (PARTIAL, not gate certified)

- **New Template — PARTIAL:** The previously absent `/admin/projects/templates/new` now has a full-page, mobile-friendly draft composer backed by the pre-existing same-origin `/api/projects/templates` POST and registered project-template writer. Initial release → sprint → task keys, fields and lengths are parsed by the canonical Zod create schema; one connected draft version is created, with submit/error/pending states, cancel and a successful detail redirect. The catalogue Create action opens this page for `project-template.manage` users. Unselected/global edit scope remains enforced by the existing policy. Execution, full legacy multi-step editor, attachments, and PG/browser acceptance remain open.
- **Template Overview — PARTIAL:** Added the explicit legacy `/admin/projects/templates/[templateId]/overview` alias, which validates template UUID and project-template.read before redirecting to the existing canonical overview; current detail view and tabs stay unchanged. Browser acceptance remains open.
- **Tenant Setup Create — PARTIAL:** Added `/admin/tenants/create` with an ordered Organization → College → Set up workflow; the actual forms and permissioned existing mutation APIs are reused, and the college picker contains only authorized active organizations. Linked Create and Set up without changing the selected safety scope or auto-selecting another college. Full onboarding lifecycle/progress and cross-tenant PG/browser certification remain open.
- **Platform Settings groups — PARTIAL:** The non-secret settings/value/origin/source inventory and the fixed SMS/intent source-template inventory now show mobile cards, retaining existing desktop tables, provenance labels and explicit provider/delivery caveats. Setting edits/provider delivery remain outside scope and are not implied to work.
- **Company curation — PARTIAL:** Added separate same-normalized-name candidate detection for distinct company IDs, with repeated college relationships deduplicated by ID. The view is read-only, uses only rows already filtered by the Super Admin service, warns when its 200-record cap truncates evidence, and does not verify, merge, create aliases or infer company identity from a name alone. Pure model unit tests authored.
- **Module Access / Feature Controls legacy delta — PARTIAL:** Existing selected-college module hierarchy now calls out Placements effective college-only On/Off behavior, non-destructive disable impact, and the fact that lower-scope placement rules are ignored by the production resolver. No new module-access edit is advertised.
- **Readiness Gate — PARTIAL:** Explicit force-dynamic readiness refresh link reopens the selected-college persisted-data evaluator; it does not assert live DNS, OTP or end-to-end application readiness.
- **Validation:** Added pure unit tests for valid draft blueprint construction, malformed slug/task denial and distinct company identity detection. These tests, TypeScript, ESLint, integration PG and 375px browser gates have **not** been run. The global planning matrix is unchanged; all affected rows retain open operational gaps.


**2026-10-15 chat-6 selected-college setup readiness (PARTIAL):** The Set up stage now reads the existing authorized persisted readiness evaluator and distinguishes failed, unknown, inconsistent, absent, and 10/10 checklist evidence. Its direct gate link supports re-evaluation; it does not equate database checks with DNS/login or launch authorization. Added pure regression tests. Auto-select after create, execution/PG, browser/keyboard and legacy sequencing remain open.


**2026-10-15 chat-6 New Template increment 2 (PARTIAL):** Draft composer now exposes Low/Medium/High/Critical first-task priority instead of hardcoding Medium, validating through existing schema. Zod create schema and existing same-origin server writer remain authoritative. Source unit tests are authored, not executed; exact legacy editor/browser and PostgreSQL acceptance remain open.


**2026-10-15 chat-6 New Template increment 3 (PARTIAL):** First-task acceptance criteria now round-trip into the initial template blueprint, rather than disappearing from create. Zod create schema and existing same-origin server writer remain authoritative. Source unit tests are authored, not executed; exact legacy editor/browser and PostgreSQL acceptance remain open.


**2026-10-15 chat-6 New Template 4 (PARTIAL):** First release description now persists on the initial blueprint with bounds checking. Canonical create writer unchanged. Regression tests authored, not executed; multi-entry legacy editor/browser and PG acceptance remain OPEN.


**2026-10-15 chat-6 New Template 5 (PARTIAL):** First sprint description now persists in the connected release-to-sprint blueprint. Canonical create writer unchanged. Regression tests authored, not executed; multi-entry legacy editor/browser and PG acceptance remain OPEN.


**2026-10-15 chat-6 New Template 6 (PARTIAL):** Draft task instructions now survive to the task blueprint; task key and parent sprint remain stable. No migration or permissions changed. Tests authored but not run; the richer legacy editor, PG and browser gate remain open.


**2026-10-15 chat-6 New Template 7 (PARTIAL):** Overview description now persists independently of the existing template summary and goal. No migration or permissions changed. Tests authored but not run; the richer legacy editor, PG and browser gate remain open.


**2026-10-15 chat-6 New Template 8 (PARTIAL):** Initial template resource creation accepts one title+HTTP(S) URL pair, enforces both-or-neither and the canonical resource blueprint schema, and never invents a file upload. Unit tests cover valid and unsafe schemes; authored, not executed. Full multi-resource management, file uploads and PG/browser parity remain open.


**2026-10-15 chat-6 hierarchy module filter (PARTIAL):** Selected-college stored descendant rules now have a strict module filter applied to both total count and page query, with URL-retained pagination and reset. Only resolver-supported Projects, Placements and Electives are selectable; effective decisions and authorization remain unchanged. Unit tests authored but not run; editing, PostgreSQL role/scope and browser acceptance open.


**2026-10-15 chat-6 Inbound Mail recipient filter (PARTIAL):** The global-only staged inbox now supports exact recipient mailbox filtering using normalized validated email and SQL lower-case equality (not wildcard lookup). The status/search/pagination links retain the recipient; duplicate recipient params are rejected. Authorization and missing-table unavailable state remain unchanged, with no outbound delivery or tenant mapping guessed. Pure and mocked-repository tests authored but not executed. Registered migration, real PG integration, mailbox webhook, retention and browser acceptance remain OPEN.


**2026-10-15 chat-6 hierarchy filter PG fixture follow-up (PARTIAL):** Added disposable-PostgreSQL regression covering per-module count-vs-row filtering, invalid module rejection, and non-admin denial. Multiple `module` query params are rejected before service invocation. Test is committed but NOT executed; real PG and browser acceptance remain open.


**2026-10-15 chat-6 Tenant Domains primary confirmation (PARTIAL):** Selecting a newly verified primary host now opens explicit confirmation showing previous and next host, login routing and DNS consequences before invoking the existing same-origin authorized mutation. No DNS edit is claimed; pure-model tests authored but not executed. Redirect/browser acceptance and host-switch race remain open.


**2026-10-15 chat-6 primary domain deletion (PARTIAL):** UI now requires exact typed primary hostname and disables destructive confirmation until it matches. Ordinary non-primary deletion retains its existing dialog. The DELETE endpoint still requires server-side stale-primary/typed-confirmation enforcement and browser race tests, so this is NOT a security-certified endpoint. Pure checks authored, unexecuted.


**2026-10-15 chat-6 primary host server enforcement (PARTIAL):** The DELETE API now strictly parses an optional hostname and the domain service checks exact confirmation *after scoped authorization* for persisted primary hosts. The UI passes it to the same-origin guarded route. Explicit denial/success PostgreSQL fixture authored; not executed. Concurrent primary changes between read and delete still require transactional row-lock certification.


**2026-10-15 chat-6 college creation handoff (PARTIAL):** The Super Admin Tenant Create stage now asks the existing permissioned scope API to select exactly the newly created college before advancing to Set up; malformed responses and failed selection show a non-success message rather than implicitly claiming a selected tenant. Shared College Create elsewhere retains its former refresh-only behavior. Unit tests authored, unexecuted; browser navigation and post-create permission/tenant fixtures remain open.


**2026-10-15 chat-6 organization-to-college creation handoff (PARTIAL):** The Tenant Create form receives the newly created organization ID from the existing authorized API, returns to the college step with an allowlisted choice, and preselects only an organization present in the current scoped server result. Duplicate/forged URL values cannot select foreign tenants. Other organization-create usages retain their prior behavior. Pure tests authored, not run; browser and PG creation acceptance open.


**2026-10-15 chat-6 students-with-overrides queue (PARTIAL):** The learner module-access trace can now filter to active learners with a persisted membership-level Projects/Placements/Electives rule, scoped in the original college SQL and preserving the filter through pagination/deep links. No contact data or edit privilege is added. Model and disposable-PG tests authored, not executed; editing and full legacy override/lock drawer remain open.


**2026-10-15 chat-6 module hierarchy descendant scope filter (PARTIAL):** Existing selected-college rules can now be filtered by Department, Program, Cohort, Section or Membership, combined with optional module filter. SQL applies exact enum-checked filters to count and rows, and page links retain both. A disposable-PG fixture and schema regression authored; no runtime browser/PG execution. Edit, audit/history, learner count and lock workflows remain open.


**2026-10-15 chat-6 Companies trust filter (PARTIAL):** Super Admin company relationships now filter by Trusted/Not trusted/All through a strict Zod enum and scoped SQL predicate, keeping status and name filters. Counts and curation candidates derive only from the selected subset, and the 200-row completeness caveat remains. Pure model and disposable-Postgres scope tests authored, not run; legacy curation verification/merge and browser tests still open.


**2026-10-15 chat-6 Companies server pagination (PARTIAL):** The previously hard-capped 200-row Company directory now uses exact scoped PostgreSQL count and 50-row page/offset queries with strict page validation, filter-retaining Previous/Next links, and explicit page-local duplicate analysis. No cross-tenant scan or false all-tenant company totals are introduced. Unit and PG fixtures authored, unexecuted; large-dataset performance, race and browser checks still open.


**2026-10-15 chat-6 Companies exact-college filter (PARTIAL):** Company relationship table has a validated college UUID filter intersected with the selected Super Admin safety scope; selected-college mismatch is denied before querying. The dropdown lists only authorized active colleges from the shared service; pagination keeps the college selection. Does not reveal recruiter PII or cross-tenant CRM notes. Unit and disposable-PostgreSQL success/foreign-scope tests authored but unexecuted, browser/privacy acceptance still open.


**2026-10-15 chat-6 primary-host deletion atomic guard (PARTIAL):** Conditional repository DELETE now independently checks the persisted primary flag against the exact confirmed hostname at mutation time; stale UI decisions cannot bypass the database predicate. Existing authorization remains in service; regression fixture authored, not executed. Concurrent host switching and DNS redirect E2E still need certification.


**2026-10-15 chat-6 locked-membership queue (PARTIAL):** College-scoped active learner finder can filter exact persisted locked membership overrides, not simply inherited locks. Query and link enums stay strict; scalar SQL `exists` filters both totals and pages. Author-only unit and disposable PG fixture, not executed; edits/drawer and browser tests remain open.


**2026-10-15 chat-6 Company status separation (PARTIAL):** Company and college-relationship lifecycle filters can now be inspected independently; default MATCH retains previous status behavior. One status cannot silently stand in for the other; typed query, page links and PostgreSQL predicates match. Source tests authored but not executed; archive lifecycle/browser parity remains open.


**2026-10-15 chat-6 Companies stable sorting (PARTIAL):** Sorted-by-name and recently-updated relationship modes now use server-side stable SQL ordering, with UUID tie-breaks, strict Zod enum and filter-preserving pages. Does not claim a historical activity timeline. Unit/PG tests authored, unrun; browser/performance acceptance open.


**2026-10-15 chat-6 Companies domain search (PARTIAL):** Employer lookup can search persisted `primary_domain` as distinct from company name, preserving literal SQL wildcard escaping, college safety scope and pagination. No sensitive CRM/private contacts are retrieved. Strict model and real-Postgres fixture authored, not run; legacy employer alias search and browser parity open.


**2026-10-15 chat-6 company identity drill-down (PARTIAL):** Each company relationship card links to an exact global employer-ID filter while retaining authorization against the caller's selected college/organization. Archived relationships can be inspected without making them editable; strict UUID input, pagination retention and unit/PG tests authored, unrun. Full legacy CRM detail and browser validation remain open.


**2026-10-15 chat-6 Companies page export (PARTIAL):** Added Super Admin-only server-validated CSV export of exactly the currently scoped, filtered 50-row directory page, with formula neutralization and capped row/total metadata. No CRM contacts/private fields; GET uses existing permissioned service, rejects duplicate query keys and emits no-store. Pure test authored, not executed; full export and browser privacy gates remain open.


**2026-10-15 chat-6 trace route strict query keys (PARTIAL):** Access-trace deep links reject repeated member IDs, page/search/override selectors and unexpected parameters before scoped SQL. The existing Zod validated service handles field content and cross-college denial. Pure unit tests authored, unexecuted; browser redirect and test acceptance remain open.


**2026-10-15 chat-6 Settings inventory search (PARTIAL):** Super Admin can now filter the existing safe, non-secret source/college policy inventory by typed section and setting/source text. This is an in-memory filter over already-authorized reads; credentials and raw environment config remain unavailable. Unit tests authored, not executed; legacy mutable settings still absent and page is not DONE.


**2026-10-15 chat-6 locked descendant hierarchy filter (PARTIAL):** The selected-college module hierarchy now filters persisted locked rows, composed safely with module and academic scope predicates in both the SQL count and page queries. UI/typed enum/pagination and PostgreSQL fixture authored; tests not executed. No authority to change lock state, and effective learner results still require the resolver trace.


**2026-10-15 chat-6 round: targeted learner override module filter — PARTIAL.** Persisted active-learner override queue can narrow to Projects/Electives/Placements stored rules, paired with existing all/only/locked modes. The SQL `exists` stays college-scoped by each verified membership; links preserve the selector and Zod disallows unknown modules. Placements membership rules are displayed as stored-but-ignored, never effective. Tests authored, not executed; editing/drawer and browser acceptance open.


**2026-10-15 chat-6: stored On/Off student-override filter — PARTIAL.** Active college learner search now narrows membership-stored enabled/disabled values (and existing locked/module filter) through typed query + persisted SQL `exists`, with page deep-links retaining the selection. This is *stored* state, not necessarily effective access where an ancestor lock wins. Tests authored, not executed; editable controls/browser parity open.


**2026-10-15 chat-6: stored-value hierarchy filter — PARTIAL.** Read-only Super Admin module hierarchy now filters persisted On/Off rules together with module, academic level and lock state, applying exactly the same SQL predicates to page/count and preserving them in pagination. The existing resolver still determines effective learner access; tests authored, not run.


**2026-10-15 chat-6: scoped UUID drill-in — PARTIAL.** Super Admin hierarchy allows exact scoped UUID only when the academic scope type is explicitly selected and validated. Learner access-trace links into its own membership record for stored-rule review; SQL still joins each rule to persisted college ownership. Authored PostgreSQL tests, not executed; no write/edit capability or final drawer parity claimed.


**2026-10-15 chat-6: readiness check status filtering — PARTIAL.** Selected-college Readiness Gate can focus on failures, unknowns or passes while its ten-source overall verdict and totals are never recalculated from a filtered subset. Scope remains Super Admin + college, filter strict Zod; unit tests authored, unexecuted. Runtime/browser acceptance open.


**2026-10-15 chat-6: Readiness CSV evidence export — PARTIAL.** Authorized read-only GET reuses college-scoped readiness service and exports all checks, not the selected UI subset, as formula-neutralized CSV. It does not claim runtime DNS/login or production launch approval; caches disabled. Pure and disposable-PostgreSQL tests authored, not executed; browser/download gates open.


**2026-10-15 chat-6: readiness area filters — PARTIAL.** Ten persisted checks can be organized into tenant lifecycle, academics, people, placements and domains, composed with status, without altering totals, evidence or readiness decision. Typed area model and unit tests authored but not run. Legacy/browser readiness workflow remains open.


**2026-10-15 chat-6: relationship owner assignment filter — PARTIAL.** Super Admin company relationships can be filtered by persisted owner membership presence, not inferred user names. Count/rows/CSV-page/pagination share the same college/organization permissioned SQL filters, without querying contact data. Strict unit and disposable PG tests authored, not executed.


**2026-10-15 chat-6: company website-completeness filter — PARTIAL.** Employer directory distinguishes recorded nonblank website URL from missing/whitespace-only metadata with scoped SQL and strict Zod. Count, pagination and page CSV use the same filter. This is not network verification or trust certification. Tests authored, not executed.


**2026-10-15 chat-6: recently changed company relationships — PARTIAL.** Super Admin Companies now supports 7/30/90-day server-side `updated_at` windows. The time window is calculated once per scoped database request and applied to both count and page; current query and CSV link retain selection. No event-history claim or guessed change types. Unit and disposable-PG tests authored, not executed.


**2026-10-15 chat-6 post-round source corrections:** Removed duplicate JSX object keys in student trace, repaired the readiness filter test's callback syntax, retained all company filters through Next-page links, and made explicitly supplied learner stored-rule selectors narrow the queue even when the broad mode remains selected. Tests remain authored/unexecuted.


**2026-10-15 chat-6 learner override detail (PARTIAL):** Added explicit Super Admin college/member scoped read-only student override details, linked from the existing verified access trace. The three module cards distinguish persisted member-level values from effective resolver decisions and disclose no student contacts. Pure tests authored, not executed; edit actions, lock mutations, audit and browser gates still open.


**2026-10-15 chat-6 student rule SET endpoint — PARTIAL:** Introduced same-origin, strict-payload PUT for an unlocked Projects/Electives membership override. Service checks Super Admin, selected-college resource permissions, persisted active learner role and global-user lifecycle, blocks a resolved broader lock, and writes the rule plus actor/tenant-scoped audit event in one transaction. Placements member edits and locked writes are rejected. Unit/disposable PG tests authored, not executed; browser UI, full row serialization/concurrency and real PG validation remain open.


**2026-10-15 chat-6 student INHERIT mutation — PARTIAL:** Server write contract now explicitly supports removing an existing Projects/Electives membership rule, distinct from writing an Off value. Missing rule is a no-op without invented audit, while actual removal writes tenant-scoped audit metadata in the same transaction. Strict discriminated Zod denies mixed actions. Tests authored, unexecuted; client editing and concurrency gates remain open.


**2026-10-15 chat-6 student lock mutation — PARTIAL:** Explicit membership-level Projects/Electives lock states may now be set/cleared with the authenticated rule write and atomic audit record. The server still forbids ignored Placements member edits and denies overrides masked by a broader locked scope. Exact enabled/locked values are both written; unit and negative PG fixtures authored, unexecuted. UI and concurrency acceptance open.


**2026-10-15 chat-6 optimistic member-rule edits — PARTIAL:** Every SET/INHERIT request now includes the caller's previously observed stored state (including locked bit). The mutation serializes on the persisted college membership row and rejects an updated rule with 409 STALE_RULE instead of blind overwrite; audit and update stay in one transaction. Pure and negative PG tests authored, unexecuted; browser concurrent editing and ancestor rule races remain open.


**2026-10-15 chat-6 student override editor (PARTIAL):** Added selected-college/learner interactive Projects and Electives Inherit/On/Off and membership-lock controls, with explicit destructive confirmation, optimistic expected state, same-origin PUT, human-readable error feedback, and refreshed trace. Placements remains read-only; broader locked ancestry disables actions. Pure UI payload tests authored, unexecuted; actual browser and PostgreSQL write/lock certification still required.


**2026-10-15 chat-6 student rule recheck endpoint — PARTIAL:** Added authenticated, Super Admin-scoped GET returning only membership stored On/Off/lock and resolver flags, `no-store` cache, no student contacts or identity. Editor can recheck and reload observed optimistic state after a conflict rather than overriding blindly. Pure unit tests authored; real PostgreSQL and browser stale-edit checks remain OPEN.


**2026-10-15 chat-6 auditable no-op suppression — PARTIAL:** After college/member authorization and strict expected-state check, identical SET requests or INHERIT of an already-inherited rule return an `unchanged` result without rewriting timestamps or inserting misleading activity events. Actual edits retain the same transactional audit. Pure regression authored; persistence/runtime proof still open.


**2026-10-15 chat-6 ancestor-lock transactional recheck — PARTIAL:** SET writes now additionally read the persisted Projects/Electives ancestor scopes under PostgreSQL shared row locks *inside* the membership write transaction and reject a stored ancestor lock before updating. This narrows stale trace decisions and prevents concurrent edits of existing ancestor rows while the transaction commits. Insert-phantom and academic-enrollment races remain open for independent PG certification; tests authored/unexecuted.


**2026-10-15 chat-6 student override/lock activity history — PARTIAL:** Added role-fenced, exact learner/college-scoped history linked from the editor. A verified active learner lookup precedes a 40-event scoped Activity Log query; pure projection exposes actor display name, time, module, old/new stored values only, never arbitrary metadata or contact information. Older history links to the audited filter surface. Unit/PG tests authored, not executed; production browser/retention/history certification open.


**2026-10-15 chat-6 source correction:** Moved mutation Zod contract to the pure module for isolated Vitest imports, removed the invalid union-property unit assertion, and made malformed JSON return a deterministic 400 rather than an unhandled server error. Real execution remains open.


**2026-10-15 chat-6 disposable PG positive regression (source-authored):** Added isolated temporary learner fixture verifying audited SET → locked SET → INHERIT, stale expected-state denial, no-op suppression and cleanup. This integration test is not yet executed and no successful migration/runtime/browser gate is claimed.


**2026-10-15 chat-6 validate learner rule recheck snapshot (PARTIAL):** The student editor no longer converts malformed, duplicated or inconsistent server snapshots into an editable inherited state; isolated unit checks authored, not executed. Full browser/PG acceptance remains open.


### 2026-10-15 chat-6 follow-up — Super Admin module editor and scoped history (PARTIAL)

- A malformed rule recheck can no longer be interpreted as an inherited rule, and an HTTP 2xx without the expected persisted module/value/lock receipt is not presented as a confirmed save. Pure unit cases are authored.
- Removing a previously stored learner rule with **Inherit** is reachable even under a broader persisted lock, while On/Off writes remain blocked. This follows the existing server distinction between INHERIT and SET.
- Authorized learner membership-rule audit history now supports a stable older-history cursor, Projects/Electives filtering, actor-name search, India-day start/end bounds, and a formula-neutralized CSV export of the **currently selected 40-record page**. Filters are applied in the scoped Activity Log service before pagination; CSV does not expose arbitrary metadata, actor email, or contact data.
- Read-only Platform Settings rejects unknown or repeated URL query keys rather than silently treating them as valid filters.
- **Acceptance remains OPEN:** branch pushes did not produce matching GitHub Actions checks; authored Vitest/tests and disposable PostgreSQL checks have **not executed** in this session. Browser/mobile interactions, learner rule mutation/concurrency, history paging, actor-name and time filtering, CSV formula/privacy checks, tenant/role negatives and full legacy oracle comparison must run before any row is declared DONE. No DATABASE tracker closure or production approval is claimed.


**2026-10-15 chat-6 feature matrix sorting (PARTIAL):** Server-side name/code sort with UUID tie-breaking, validated URL state and filter-preserving pagination. Unit contracts authored; PostgreSQL/browser evidence not yet executed. Existing module matrix is not parity-closed.


**2026-10-15 chat-6 feature matrix stored college-rule module filter (PARTIAL):** Strict Projects/Placements/Electives URL selector now applies an exact persisted COLLEGE rule EXISTS predicate before totals and pagination. It is not an effective per-learner access filter. Authored unit regression, runtime/browser not executed.


**2026-10-15 chat-6 feature matrix stored value (PARTIAL):** Server-side persisted COLLEGE-rule On/Off filter applies to the same exact module row and to both count and page; inherited/effective values are not silently relabelled. Pure tests authored, PG/browser pending.


**2026-10-15 chat-6 feature matrix explicit locked-rule filter (PARTIAL):** Scoped college-rule EXISTS can require stored locked state, composed on the *same* Projects/Placements/Electives rule with stored On/Off. Count and page agree. Not a claim of learner-level lock evaluation; tests authored, not executed.


**2026-10-15 chat-6 feature matrix no-rule inspection (PARTIAL):** Explicit stored COLLEGE-rule absence can now be found per selected module, with contradictory locked/value selectors rejected rather than interpreted as inherited Off. Exact scoped NOT EXISTS affects both count and page. Authored tests; DB/browser pending.


**2026-10-15 chat-6 recent persisted college-rule changes (PARTIAL):** Optional 7/30/90-day rule updated-at windows use one server clock and SQL predicate for both totals/page. A missing rule cannot also be recent, so that combination is rejected. No event-history or workflow-causation claim; tests authored, execution pending.


**2026-10-15 chat-6 feature matrix name/code search selector (PARTIAL):** Safe literal case-insensitive substring query can target college name, code, or both, preserving filters through database-count/page and navigation; this avoids wildcard expansion and no private-contact searches. Authored unit tests, runtime PG/browser open.


**2026-10-15 chat-6 feature matrix descending sorts (PARTIAL):** Name/Code A–Z and Z–A database ordering now use UUID secondary tie-breaks so paging remains deterministic. Validation and URL retention tested in source; PG/browser acceptance open.


**2026-10-15 chat-6 strict feature matrix URL contract (PARTIAL):** Rejects repeated filters and unknown query keys before loading scoped college data. Previously first duplicate value was silently chosen and out-of-range array page values could be coerced. Pure tests authored, execution/browser pending.


**2026-10-15 chat-6 feature matrix stale-page recovery (PARTIAL):** Search/filter now counts first, clamps stale page bookmarks to its last available page and then fetches the matching scoped row slice instead of presenting a false empty result. Request-level count/query racing changes remain a PostgreSQL/browser acceptance issue; pure boundary tests authored.


**2026-10-15 chat-6 matrix CSV page export (PARTIAL):** New authorized Super Admin GET exports exactly the strict-filtered and currently permissioned page (max 20 colleges), effective source-labelled module decisions, formula-neutralized strings and row/total headers with private no-store caching. No recruiter/learner contacts or global raw rule dump. Unit tests authored, PG/browser/download evidence pending.


**2026-10-15 chat-6 focused module hierarchy drill-in (PARTIAL):** Matching colleges now carry the selected Projects/Placements/Electives module into their read-only hierarchy view on both mobile cards and desktop rows. Cross-college authorization continues in the destination service. Pure navigation checks authored; browser/back-forward and full legacy parity remain open.


**2026-10-15 chat-6 default feature filter correction (PARTIAL):** Normalize the browser form's empty Any-college module selector into no filter before strict Zod service parsing. Unknown module strings still fail closed. Unit default-form regression authored; manual browser submission not yet run.


**2026-10-15 chat-6 disposable PostgreSQL filter acceptance fixture (AUTHORED, NOT EXECUTED):** A temporary organization-owned college verifies no-rule → stored locked Off transitions, same-row module/value/lock/recent filters, count and row consistency, foreign selected-college denial and wrong-role denial, plus page CSV. Guarded behind TEST_DATABASE_URL and DB03 isolated target; cleans up temporary rule and college. Execution/CI and visual parity remain blockers.


### 2026-10-15 chat-6 college Feature Controls write workflow — PARTIAL, not accepted
Added exact SUPER_ADMIN-scoped persisted COLLEGE module rule reader, strictly typed and optimistic SET/INHERIT mutation, a transactional high-importance Activity Log event, ancestor GLOBAL/ORGANIZATION lock checks, no-op suppression, and a human-confirmed editor in the college hierarchy. All three optional modules are supported at COLLEGE scope; student lower-level controls remain independent. Recheck and reviewed receipts do not infer downstream participation gates. Authorized, page-bounded audit history and formula-neutralized CSV are accessible from the hierarchy. Pure tests and an isolated-PostgreSQL success/negative fixture have been **authored but not executed** in this environment. Transactional global/organization insert races, cross-role/tenant DB execution, browser confirmation/responsiveness, export paging/privacy, exact legacy Oracle parity and operational acceptance remain open. Do not mark the matrix or DATABASE tracker DONE.

### 2026-10-15 chat-6: DB10 Super Admin announcements and audit findings — PARTIAL

**Before:** migration 0076 registered `announcements`, `bug_reports`, `bug_report_activities` and related tables; the Super Admin announcements page had single-recipient create/edit/list but no enforced publication-consent step or all/selected-college broadcast. Audit Findings had a read-only DB10 listing and linked the generic tracker detail/status workflow.

**After (source committed on chatgpt/chat-6):**
- Super Admin single-recipient announcement CREATE and UPDATE require explicit publication consent in the service, with a review dialog for creation and an explicit checkbox for edits. The shared College Admin composer remains unchanged through an opt-in prop. Ordinary activity in the announcement inbox does **not** send SMS or email.
- A separate same-origin POST publishes one notice per active, authorized college for ALL_COLLEGES or SELECTED_COLLEGES, with strict Zod input, server-validated selected IDs, 500-college safety cap, confirmed audience/expiry/pinned review, per-college `college.manage` checks, an atomic Drizzle insert and an accompanying high-importance Activity Log row per notice. No external-delivery fanout is claimed; producer status and recipient visibility still require runtime verification.
- Audit Findings has strict URL validation, environment and sort filters, cursor retention, a dedicated finding-detail deep link reusing the existing permitted tracker detail/status/retest UI, inline confirmed status transitions through the existing same-origin versioned PATCH, and privacy-minimized, 50-row page CSV export. Reporter names, descriptions, private notes, raw attachment keys and signed download URLs are excluded from the CSV.
- Added focused unit tests plus disposable-PostgreSQL integration fixtures for the DB10 tracker status/retest/audit cycle and the consented selected-college broadcast/audit transaction. These tests are **authored, not executed**, in this GitHub-only builder session.
- Readiness remains gated by `DB10_ANNOUNCEMENTS_READY=DB10_VERIFIED` and `DB10_TRACKER_READY=DB10_VERIFIED`. The migration must be **applied and independently replay/verified** in the target environment before setting either flag. Registered SQL is not execution evidence. Do not mark these surfaces DONE or imply external sending.

**Still open for acceptance:** execute targeted Vitest, typecheck, disposable PostgreSQL migration 0076 replay/real transaction and role/tenant negatives, same-origin route tests, browser review/consent and stale-version flows, pagination/CSV privacy, and compare the DEV-ONLY legacy surfaces against approved oracle SHAs. No change to authoritative DATABASE tracker counts.


**2026-10-15 chat-6 DB10 notices route fence (PARTIAL):** The Super Admin announcement UI now checks both role and active platform account before reporting feature flags or reading tenant notices. Source/unit contract authored; scoped browser verification remains open.


**2026-10-15 chat-6 notices URL contract (PARTIAL):** Announcements history rejects repeated/unknown parameters, invalid deleted selector and incomplete cursor before issuing DB queries. Cursor validation is covered by authored unit tests; browser evidence remains open.


**2026-10-15 chat-6 notices list API strict filters (PARTIAL):** DB10 announcements GET now rejects duplicate/unknown query keys and validates its cursor, page size and deleted selector prior to DB access. Tests authored; runtime evidence pending.


**2026-10-15 chat-6 DB10 broadcast duplicate-recipient safety (PARTIAL):** Strict server-side selected-college input now rejects duplicate college IDs rather than silently deduplicating before publishing. Authored schema tests, database/browser verification open.


**2026-10-15 chat-6 broadcast local-time preflight (PARTIAL):** Publication review now remains disabled for invalid local datetimes or expiry preceding schedule; no silent invalid-date fallback or thrown ISO conversion. Tests authored; mobile/browser evidence open.


**2026-10-15 chat-6 scoped composer local-time preflight (PARTIAL):** Create and edit both validate local schedule/expiry rather than converting malformed input into an immediate notice. Source and timing-model unit tests authored, interactive parity pending.


**2026-10-15 chat-6 DB10 tracker query normalizer (PARTIAL):** Issues board now accepts ordinary empty form filters, rejects repeated/unknown keys, and preserves raw ISO cursors for service validation (avoiding transformed-Date double parsing on later pages). Pure tests authored; browser pagination evidence open.


**2026-10-15 chat-6 tracker list API strictness (PARTIAL):** Tracker GET now rejects ambiguous duplicate keys, unknown filters, out-of-bound limits and incomplete cursors before querying DB10, without passing transformed Date values twice through Zod. Source/unit tests authored; API runtime checks open.


**2026-10-15 chat-6 invalid tracker finding URL denial (PARTIAL):** Both tracker issue and audit-finding detail (shared entrypoint) now return standard not-found for malformed public IDs rather than propagating validation into a generic server error. Guard contract tests authored; interactive route evidence open.


**2026-10-15 chat-6 DB10 announcement account-status denial (PARTIAL):** The shared announcement services now deny suspended/inactive platform actors for admin list, mutation, audience targets and recipient feed, in addition to existing membership and tenant fences. Authored unit contract, negative DB/runtime tests still required.


**2026-10-15 chat-6 immutable tracker activity readability (PARTIAL):** The finding detail no longer drops retest notes when the same audit record has from/to values; it renders transition, note, and non-secret actor attribution separately. Pure tests authored; browser history acceptance pending.


**2026-10-15 chat-6 DB10 private response caching (PARTIAL):** Authenticated announcement-admin and tracker list/detail JSON endpoints now send explicit private, no-store headers to prevent accidental intermediary persistence of tenant-scoped notice and issue data. Unit source regression authored; HTTP runtime headers still require verification.


**2026-10-15 chat-6 DB10 announcement disposable PostgreSQL fixture (AUTHORED, NOT EXECUTED):** A test against registered `announcements` checks create → scoped list → optimistic edit/stale conflict → soft-delete/restore and inactive/wrong-role denial using seeded identities and cleaned-up rows. It is gated by TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE; full migration replay, runtime and browser acceptance still open.


**2026-10-15 chat-6 DB10 tracker disposable PostgreSQL fixture (AUTHORED, NOT EXECUTED):** A registered-table integration scenario now creates an isolated tracker reporter/issue, reads list/detail, writes a version-checked workflow transition with activity, rejects stale mutations, and verifies scoped/role-negative access; teardown removes temporary rows. No task or phase closure is implied until executed evidence exists.


**2026-10-15 chat-6 Super Admin broadcast actor-status fence (PARTIAL):** Both broadcast college enumeration and publication now explicitly deny inactive platform actors even if a stale Super Admin role appears in the request context; guards precede DB access. Unit source contract authored; live negative authorization and browser checks remain pending.


**2026-10-15 chat-6 tracker page actor-status route fence (PARTIAL):** Both issue list/detail and the Audit Findings board require an active platform Super Admin before returning migration-flag status or fetching data. Routes use the standard dashboard redirect; unit source assertions authored, browser permission negatives pending.


**2026-10-15 chat-6 DB10 announcements literal search (PARTIAL):** Super Admin notices now support bounded title/message substring search, protected from SQL wildcard expansion by `position(...)`; server-side filtering occurs before cursor paging, search is carried into Older/Include deleted links, and malformed query states fail closed. Authored pure validation tests; runtime/PG/browser evidence remains open.


**2026-10-15 chat-6 DB10 announcement audience filter (PARTIAL):** Super Admin history now filters persisted `receiver_type` before page limit and retains the exact filter across deleted/search/cursor links. Invalid audience enum values are rejected at UI/API boundaries. Unit tests authored, browser/PG still pending.


**2026-10-15 chat-6 persisted DB10 visibility filtering (PARTIAL):** The announcement history can now filter LIVE/SCHEDULED/EXPIRED/DELETED before cursor paging using one database clock per request, with a boundary-tested status model; `DELETED` explicitly selects soft-deleted rows regardless of the Include deleted convenience toggle. Browser/PG evidence still open.


**2026-10-15 chat-6 bounded announcement CSV (PARTIAL):** Scoped Super Admin notice history has a 50-row current-page export, using identical DB10 search/audience/visibility/cursor filters. Only notice metadata is included, with spreadsheet-formula-safe values and private no-store headers; no content body or recipient contact export. Pure tests authored; download/PG/browser checks pending.


**2026-10-15 chat-6 Audit Findings account-role filter (PARTIAL):** The real DB10 board and CSV export now share persisted `account_role` filtering, with strict role enums and cursor-state retention; the underlying service constrains the SQL page before fetching. Unit validation tests authored; integration and browser acceptance pending.


**2026-10-15 chat-6 Audit Findings persisted resolution (PARTIAL):** A strict resolution filter distinguishes SQL NULL (UNRESOLVED) from each DB10 resolution enum; the same predicate applies before pagination/export and survives bookmark/cursor navigation. Unit tests authored; database evidence pending.


**2026-10-15 chat-6 Audit Findings retest status (PARTIAL):** DB10 persisted retest PASS/FAIL/NOT_RETESTED can be independently filtered in the board and CSV, scoped and paginated by service SQL. Unit enum and query tests authored, integration/browser acceptance still open.


**2026-10-15 chat-6 Audit Findings verified-state filter (PARTIAL):** The persisted `production_verified` boolean can now be filtered as Yes/No/All, including false without treating it as absent; status survives pagination/export without exposing private metadata. Validation tests authored, browser/DB evidence open.


**2026-10-15 chat-6 bounded tracker activity history (PARTIAL):** DB10 issue/finding details now retrieve a deterministic newest-first 50-event page with timestamp/UUID keyset cursor and an Older audit events link. Both detail routes and the private API validate incomplete/duplicate cursors; scoped ownership is verified before activity data loads. Authored cursor tests; high-volume PG/browser acceptance remains open.


**2026-10-15 chat-6 bounded screenshot metadata (PARTIAL):** DB10 finding detail now uses independent 50-row attachment keyset pages, preserving activity-history pagination when navigating screenshots (and vice versa); all attachment lookups remain behind scoped issue ownership, and no storage keys or public download URLs are returned. Authored cursor regression tests; PG/browser checks remain open.


**2026-10-15 chat-6 visibility schema contract correction (PARTIAL):** Moved notice visibility selector onto admin-list Zod schema; edit requests remain strict and cannot smuggle ignored visibility fields. Regression unit confirms read query acceptance and write rejection. Executed typecheck/DB/browser still pending.


**2026-10-15 chat-6 DB10 announcements filtered PostgreSQL fixture (AUTHORED, NOT EXECUTED):** Extends isolated registered-table lifecycle with literal title search, persisted audience and LIVE/SCHEDULED/DELETED filtering before page limit, export projection and cross-tenant history check. Requires a disposable migrated PG runner; no false acceptance claim.


**2026-10-15 chat-6 DB10 Audit Findings filtered PostgreSQL fixture (AUTHORED, NOT EXECUTED):** Extends isolated real-table tracker workflow with account-role, resolution-null, retest state, production-verification boolean (including false), and status selection before pagination, alongside existing foreign-scope and wrong-role denials. Execution and browser acceptance pending.


**2026-10-15 chat-6 DB10 soft-delete stale-retry guard — PARTIAL:** An already-deleted announcement cannot acknowledge a stale delete as successful; the caller version is checked after authorization even for no-op repeat requests. Source-only regression test added; transactional PostgreSQL/browser acceptance pending.


**2026-10-15 chat-6 DB10 restoration stale-retry guard — PARTIAL:** Already-restored announcements still enforce caller expectedVersion; concurrent edits cannot be mistaken for an accepted no-op restore. Source regression authored, DB/browser execution pending.


**2026-10-15 chat-6 DB10 pinned/unpinned announcement history (PARTIAL):** Persisted pin status filters before pagination and carries into page bookmarks, deleted toggle, and capped CSV. Strict URL/API schema rejects invalid selection; source unit authored, execution pending.


**2026-10-15 chat-6 announcement sender filter (PARTIAL):** Added persisted sender-type filter with DB10 allowed enums for Super Admin history, API and CSV; retains filter when paging and toggling deleted visibility. Unit validation authored, runtime/browser evidence open.


**2026-10-15 chat-6 broadcast reviewed college-set fence (PARTIAL):** Publication now optionally verifies the exact reviewed college IDs against resolved active/authorized targets, returning a recoverable 409 on directory drift instead of silently changing the broadcast audience. The Super Admin UI sends reviewed IDs and explains re-review. Does not claim snapshot-isolated active-college locks or provider delivery; unit source tests authored.


**2026-10-15 chat-6 announcement blank-search recovery (PARTIAL):** Form query consisting solely of whitespace now resolves to an unfiltered server history instead of a false malformed-link error; nonblank values remain trimmed/capped and unknown keys fail closed. Source tests authored, browser execution open.


**2026-10-15 chat-6 Audit Findings persisted issue-type filter (PARTIAL):** Added explicit exact issue_type predicate from the real DB10 report table. Form/server validation bounds the search to 80 characters, carries it into both cursor and CSV, and never substitutes synthetic categories. Authored unit tests, PG/browser acceptance still open.


**2026-10-15 chat-6 Audit Findings IST start-date filter (PARTIAL):** `created_at` now supports an inclusive IST calendar-day lower bound (start 00:00 +05:30) before service pagination. Exact date URL survives CSV and cursor links, validation rejects invalid dates, no timezone inference. Tests authored; PG/browser pending.


**2026-10-15 chat-6 Audit Findings IST end-date filter (PARTIAL):** Upper bound is exclusive midnight the following IST day so records throughout the selected end date are included. Reversed ranges fail server Zod validation; query travels into CSV and cursor links. Source unit authored, PG/browser acceptance open.


**2026-10-15 chat-6 DB10 single-notice audit transaction (PARTIAL):** A Super Admin per-college notice is now inserted in the same PostgreSQL transaction as the high-importance Activity Log publication receipt, mirroring multi-college broadcast attribution. Failure of activity insertion rolls back notice creation; event metadata includes only notice ID and audience type, not message bodies or contacts. Disposable PG verification source authored; runtime/browser acceptance open.


**2026-10-15 chat-6 transactional notice audit fixture (AUTHORED, NOT EXECUTED):** Extended disposable DB10 lifecycle fixture to assert exactly one persisted Activity Log publication receipt without notice text, stale no-op delete/restore 409 semantics, and deterministic cleanup of activity and notice fixture rows. Do not interpret authored coverage as executed migration acceptance.


**2026-10-15 chat-6 HR recruiter strict URL boundary — PARTIAL:** The /admin/hr and recruiter alias now reject duplicate/unknown query keys and malformed filters, normalize blank status/search/page selections without defaulting to the first duplicated value, and retain the existing non-leaking reset state. Pure tests authored; browser/PG acceptance pending.


**2026-10-15 chat-6 readiness strict URL contract — PARTIAL:** Selected-college readiness checks now reject unrelated, repeated or malformed status/area parameters instead of silently ignoring them; blank native-select defaults normalize to ALL. Scoped database lookup remains authoritative; no readiness count is fabricated. Pure tests authored; execution pending.


**2026-10-15 chat-6 scoped college actions — PARTIAL:** College edit/archive actions are now rendered only when `college.manage` is granted for that persisted row's organization and college, on both mobile cards and desktop rows. Read-only setup/readiness links remain. Explicit Super Admin scope and disabled-role tests authored; no mutation/browsing acceptance claim.


**2026-10-15 chat-6 Colleges scoped empty state — PARTIAL:** The college directory explicitly distinguishes zero authorized active colleges from a loaded table, without suggesting deletion or exposing foreign tenants. Reset guidance is safe for the current Super Admin scope; source test authored, browser checks pending.


**2026-10-15 chat-6 college setup navigation parity — PARTIAL:** Desktop college rows now provide the same persisted-tenant setup action mobile already had; mobile cards expose Branding alongside Readiness. Links resolve encoded persisted college IDs and leave authorization to destination services. Unit source assertions authored; browser/micro-layout unverified.


**2026-10-15 chat-6 Organizations scoped empty state — PARTIAL:** Added a clear no-visible-active-organization state, avoiding a silent blank table under restrictive scopes; create affordance remains permission-gated. Responsive page and authored unit source check; browser acceptance pending.


**2026-10-15 chat-6 Domains no-selection authorization fence — PARTIAL:** Before showing the choose-college informational empty state, the Super Admin domains route now requires central `admin-scope.select`, so an unauthorized signed-in user cannot enumerate the existence or expected shape of this administration surface. Exact college lookups still require the domains service guard. Unit role and page contract authored; browser evidence open.


**2026-10-15 chat-6 Settings invalid-filter early return — PARTIAL:** Validate strict `q`/`section` URL before any settings inventory database read while retaining the central Super Admin authorization fence before returning an error. Invalid params no longer cause avoidable selected-college policy queries; unit route contract authored, browser execution open.


**2026-10-15 chat-6 Recruiter Accounts literal search — PARTIAL:** Scoped recruiter directory text search escapes `%`, `_` and backslash before parameterized ILIKE, preventing user-provided wildcard expansion to unrelated recruiters while keeping existing DB visibility predicates and count/page consistent. Pure escaping tests authored; isolated PG and browser acceptance pending.


**2026-10-15 chat-6 College action parent-scope fence — PARTIAL:** If a selected college and organization appear inconsistent, the college-row edit/archive affordances now fail closed on organization mismatch in addition to centralized `college.manage`. The persisted service still rechecks the true parent and authorization; pure negative tests authored, browser pending.


**2026-10-15 chat-6 Announcements filtered-empty messaging — PARTIAL:** History distinguishes truly empty Super Admin notice inventory from a filtered view with no matches, with actionable reset guidance while preserving compose/broadcast surfaces. No synthetic zero-success after DB10 readiness disabled. Pure tests authored; browser visual acceptance pending.


**2026-10-15 chat-6 Readiness no-filter-matches state — PARTIAL:** Readiness page now announces when a valid status/area filter yields zero checks without presenting a false ten-check zero verdict. Overall readiness and raw counts remain computed from all persisted inputs. Responsive content and source test authored; browser/PG proof pending.


## 2026-10-28 source-only import reachability checkpoint — Super Admin (NOT ACCEPTED)

Attached to **existing tenant/module, people, interview and operational families**, not a parallel tracker. Legacy FE at `9d56bb7a347b06f242ef615c19fdc298f83329e0`; selected vNext source at `7974c721b163f98ced26ada834f564922d28aba5`; discovery report `docs/audit/legacy-dev-census/2026-10-28-wave3-source-reconciliation.md`.

- **Module hierarchy and access explanation:** legacy `src/pages/superadmin/sections/ModuleAccess.js:L92-L131` explains college module state versus placement-cell learner eligibility and `L165-L184` suppresses stale history on college switches. VNext `src/app/(authenticated)/admin/features/[collegeId]/page.tsx` delegates to `src/components/admin/descendant-feature-rule-editor.tsx` for inherited/explicit/locked descendant scopes. Verify all depth/role/college cases, authorization, stale asynchronous responses, persistence, audit, module-off routing and meaningful disabled states end-to-end; both implementations existing does not prove equivalence.
- **Tenant administration:** legacy `src/pages/superadmin/sections/CollegeBranding.js`, `CollegeSignIn.js`, `CollegeSubdomain.js`, `ManageCollegeDrawer.js`, `Colleges.js`, `TenantSettings.js` and `RecruiterAccounts.js` are source-verified embedded UI, with actions that need trigger → edit/confirm/discard → authorized save → visible result checks. Preserve tenant isolation and public-join effects.
- **Interview and readiness sections:** legacy `InterviewForm.js`, `InterviewEditForm.js`, `InterviewFeedbackForm.js`, `ReadinessGate.js` and `FeatureControlsHub.js` contain interfaces separate from the route shell. Inspect booking/edit/reschedule, feedback, negative states and underlying side effects before closing the owning families.

**Source investigation only:** no PostgreSQL/browser acceptance run, no source-derived green, no replacement of the official tracker.


## 2026-10-28 deeper academic/admin imports — source-only acceptance checkpoint

Newly source-inspected descendants include `src/pages/superadmin/sections/{Faculty,FacultyAssignment,Students,Departments,Courses,CourseProgress,Lessons,LessonContent,AdminResources,Quizzes,SemesterManagement,SemesterCourseMapping,Attendance,Batches,BatchPromotion,Classes,LectureHalls,Companies,HiringDashboard,Jobs,PeopleDirectory,Programs}.js` (legacy FE `9d56bb7a347b06f242ef615c19fdc298f83329e0`). See `docs/audit/legacy-dev-census/2026-10-28-wave4-6-reconciliation.md`.

Each is a conditional nested section within established Super Admin/admin page families. Preserve role/college scope and unique triggers for editors, import/export, schedules, attendance, grading, project/placement related navigation, tenant controls, failure/retry and destructive save states. Reconcile against existing consolidated vNext routes and shared administrative components before acceptance; no one-to-one route/file equivalence is assumed. Follow the already identified `ModuleAccess.js` inheritance/history/permission contract separately. No DB/browser tests or greens were asserted by this source inspection.
