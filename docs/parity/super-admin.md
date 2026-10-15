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
