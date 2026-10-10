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
