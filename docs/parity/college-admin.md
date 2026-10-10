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

## Page: Dashboard
**Legacy:** `/college-admin/dashboard`  
Legacy route maps dashboard quick actions to Departments, Courses, Programs, Faculty, Students, Lessons, Content, Semesters, Semester-Course Mapping, Batches, Classes, Batch Promotion, Faculty Assignment, Lecture Halls, Jobs, Hiring Dashboard, Attendance, Assignments, Quizzes and People.

- [ ] Dashboard KPI/summary cards match the legacy AdminDashboardView.
- [ ] Setup/attention/quick-action cards match.
- [ ] Every quick action resolves to the correct College Admin page.
- [ ] College-scoped counts use the active college only.
- [ ] "Admin not assigned to a college" warning state matches.
- [ ] Partial-data failure never renders false zeroes.
- [ ] Loading and responsive card layout are verified.

## Page: Activity Log
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
**Legacy:** `/college-admin/semesters`

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
**Legacy:** `/college-admin/semester-courses`

- [ ] Program + semester context selectors match.
- [ ] Existing course mappings table/list matches.
- [ ] Add/mapping form supports course, offering/type and required metadata present in legacy.
- [ ] Remove/unmap confirmation matches.
- [ ] Duplicate mapping validation matches.
- [ ] CORE/ELECTIVE semantics remain correct.
- [ ] Search/filter/loading/empty/error states match.

## Page: Batches
**Legacy:** `/college-admin/batches`

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
**Legacy:** `/college-admin/classes`

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
**Legacy:** `/college-admin/batch-promotion`

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
**Legacy:** `/college-admin/lecture-halls`

- [ ] Hall list/table fields match.
- [ ] Create Hall form fields/validation match.
- [ ] Edit Hall modal matches.
- [ ] Delete confirmation/dependency conflicts match.
- [ ] Search/filter/pagination match.
- [ ] Capacity/location/identifier semantics match.
- [ ] Schedule-conflict-related data needed by Classes is available.
- [ ] Loading/empty/error states match.

## Page: Electives
**Legacy:** `/college-admin/electives`

- [ ] Feature-disabled state matches ("Electives is turned off for this college").
- [ ] Elective offerings/list match.
- [ ] Create/edit lifecycle and eligibility/selection fields match.
- [ ] Student choice/enrollment management matches.
- [ ] Capacity/selection rules match.
- [ ] Close/finalize actions and confirmations match.
- [ ] Loading/empty/error states match.

## Page: Attendance
**Legacy:** `/college-admin/attendance`

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

## Page: Courses
**Legacy:** `/college-admin/courses`

- [ ] Course catalogue table/card fields match.
- [ ] Create Course form/modal matches.
- [ ] Edit Course flow matches.
- [ ] Archive/delete/deactivate consequences match.
- [ ] Search/filter/pagination match.
- [ ] Course detail/deep links match.
- [ ] Duplicate code/name validation matches.
- [ ] Loading/empty/error states match.

## Page: Course Detail / Offering
**Legacy:** `/college-admin/courses/[id]`

- [ ] Course identity/metadata sections match.
- [ ] Offering/semester/class associations match.
- [ ] Teaching assignments match.
- [ ] Learning/content summary matches.
- [ ] Edit/lifecycle actions and confirmations match.
- [ ] Access/not-found/error states match.

## Page: Lessons
**Legacy:** `/college-admin/lessons`

- [ ] Aggregate Lessons list/search/filter matches.
- [ ] Course/lesson path context is visible.
- [ ] Create Lesson flow matches.
- [ ] Edit Lesson flow matches.
- [ ] Delete/reorder actions match.
- [ ] Deep link to Course/learning path works.
- [ ] Loading/empty/error states match.

## Page: Video Content
**Legacy:** `/college-admin/lesson-content?type=video`

- [ ] Video aggregate list/filter matches.
- [ ] Create/edit video metadata matches.
- [ ] Schedule/visibility controls match.
- [ ] Upload/provider fields match.
- [ ] Delete/replace consequences match.
- [ ] Signed playback is explicit BLOCKED until storage is live.
- [ ] Loading/empty/error states match.

## Page: Resources
**Legacy:** `lesson-content?type=resources`

- [ ] Resource aggregate list/filter matches.
- [ ] Link/file fields match.
- [ ] Add/edit/remove actions match.
- [ ] File upload/download remains explicit BLOCKED until storage is live.
- [ ] Empty/error states match.

## Page: Live Classes
**Legacy:** `lesson-content?type=live-classes`

- [ ] Live-class aggregate list matches.
- [ ] Meeting URL/start/end/schedule fields match.
- [ ] Create/edit/remove actions match.
- [ ] Upcoming/past state matches.
- [ ] Empty/error states match.

## Page: Assignments
**Legacy:** `/college-admin/assignments`

- [ ] Aggregate list/filter/pagination match.
- [ ] Create Assignment fields/validation match.
- [ ] Edit/delete actions match.
- [ ] Due-date/schedule/visibility match.
- [ ] Submission counts/report deep links match where legacy exposes them.
- [ ] File attachment workflow is explicit BLOCKED until storage is live.
- [ ] Loading/empty/error states match.

## Page: Quizzes
**Legacy:** `/college-admin/quizzes`

- [ ] Aggregate list/filter/pagination match.
- [ ] Create/Edit Quiz workflow matches.
- [ ] Questions/answers/points/attempts fields match.
- [ ] Schedule/open/close/results-publication controls match.
- [ ] Delete/close confirmation matches.
- [ ] Loading/empty/error states match.

## Page: Course Progress
**Legacy:** `/college-admin/course-progress`

- [ ] Program/course/class filters match.
- [ ] Learner progress table/metrics match.
- [ ] Lesson/content completion breakdown matches.
- [ ] Search/sort/export if present are accounted for.
- [ ] Drill-in behavior matches.
- [ ] Loading/empty/error states match.

# People

## Page: Faculty
**Legacy:** `/college-admin/teachers`

- [ ] Faculty list columns/profile metadata match.
- [ ] Search/filter/pagination match.
- [ ] Create/invite Faculty flow matches.
- [ ] Edit Faculty flow matches.
- [ ] Active/inactive lifecycle matches.
- [ ] Profile/detail drawer/page actions match.
- [ ] Loading/empty/error states match.

## Page: Faculty Assignment
**Legacy:** `/college-admin/faculty-assignment`

- [ ] Course/Class/Faculty selectors match.
- [ ] Existing assignment list/table matches.
- [ ] Assign Faculty action matches.
- [ ] Change/reassign/remove actions match.
- [ ] Duplicate/conflict validation matches.
- [ ] Active/inactive assignment state matches.
- [ ] Loading/prerequisite/error states match.

## Page: Students
**Legacy:** `/college-admin/students`

- [ ] Learner list/profile metadata match.
- [ ] Search/filter/pagination match.
- [ ] Create/import/add learner flows present in legacy are accounted for.
- [ ] Edit learner fields/lifecycle actions match.
- [ ] Program/batch/class assignment state matches.
- [ ] Profile/detail drill-in matches.
- [ ] Loading/empty/error states match.

## Page: People Directory
**Legacy:** `/college-admin/people`

- [ ] Combined role directory fields match.
- [ ] Role/status/search filters match.
- [ ] Person detail/profile action matches.
- [ ] Membership/role/lifecycle actions match College Admin permissions.
- [ ] Loading/empty/error states match.

## Page: Student Groups List
**Legacy:** `/college-admin/student-groups`

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
