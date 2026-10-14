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
