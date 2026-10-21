# Work packet (wave 2): edit src/app/(authenticated)/admin/faculty/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/super-admin-user-admin-controller.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-19/faculty-search-controller.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-6/superadmin-teachers.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-1-007-001  [P2] GAP  facet F01  effort M
- Legacy: `SuperAdminUserAdminController.java:132-168` GET `/faculty-admins` role/org/college filters.
- vNext now: `src/app/(authenticated)/admin/people/page.tsx:89-189`, `/admin/faculty/page.tsx:14-46` membership and faculty directories; no exact REST alias.
- Fix: Map legacy admin-account endpoint into scope-aware membership list and role filters.

## G2-1-007-002  [P2] GAP  facet F01  effort M
- Legacy: `SuperAdminUserAdminController.java:170-222` POST `/faculty-admins` creates ADMIN/TPO.
- vNext now: `src/components/admin/person-onboard-dialog.tsx:69-84` POST people onboarding with membership roles; `admin/faculty/page.tsx:22` forced FACULTY.
- Fix: Provide superadmin-only COLLEGE_ADMIN/TPO choice at targeted college rather than only forced FACULTY selector.

## G2-1-007-006  [P2] GAP  facet F02  effort M
- Legacy: `AdminUsers.js:39-55,335-585` one Admin Users screen with role switch, form, sessions panel and history.
- vNext now: `src/app/(authenticated)/admin/people/page.tsx:89-189`, `/admin/faculty/page.tsx:14-46` split role directory, onboarding and membership detail.
- Fix: Keep legacy tab/sidebar reachability and per-account sessions panel accessible one click.

## G2-1-007-008  [P2] GAP  facet F03  effort M
- Legacy: `AdminUsers.js:40` default role ADMIN; `:18-20` role option TPO.
- vNext now: `admin/people/page.tsx:99` default ALL with role options COLLEGE_ADMIN/TPO; `admin/faculty/page.tsx:22` forced FACULTY.
- Fix: Preserve dedicated Admin/TPO management default and TPO label.

## G2-18-031-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy Students vs Faculty under Super Admin /superadmin/students and /superadmin/teachers with shared section code; superadmin/students.js:1-33;superadmin/teachers.js:1-33
- vNext now: vNext /admin/students and /admin/faculty with AdminScopedReadPage; src/app/(authenticated)/admin/students/page.tsx:20-92;admin/faculty/page.tsx:14-46
- Fix: Preserve Teachers→Faculty navigation alias and route-safe breadcrumbs for legacy entry points

## G2-18-031-004  [P2] GAP  facet F01  effort M
- Legacy: Legacy Super Admin without college renders warnings Choose a college in header to see its students/faculty; superadmin/students.js:12-24;superadmin/teachers.js:12-24
- vNext now: vNext AdminScopedReadPage relies on adminScope and can render no scope, /admin/students suppresses tools until choices load; admin/students/page.tsx:26-52;admin/faculty/page.tsx:18-36
- Fix: Preserve missing-college recovery in same shell and disable mutation until scope verified

## G2-18-031-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy Students/Faculty show PeoplePageOverview title, description and four metrics before registration and roster; Students.js:1091-1107;Faculty.js:940-952
- vNext now: vNext /admin/students starts registration/bulk then roster; /admin/faculty uses AdminScopedReadPage with intro bulk tools; admin/students/page.tsx:62-90;admin/faculty/page.tsx:21-44
- Fix: Restore legacy summary-metric strip and sections order while retaining new workflows

## G2-18-031-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy registration/bulk editing inside AntD collapses/cards and modals, all under ln-module admin-list-page; Students.js:1103-1130,1250-1300;Faculty.js:940-979,1110-1172
- vNext now: vNext student registration inline, bulk in details; faculty onboarding Dialog, bulk Disclosure; admin/students/page.tsx:70-82;admin/faculty/page.tsx:21-30
- Fix: Choose legacy disclosure default, heading, borders and spacing per role, avoid extra canvas/card nesting

## G2-18-031-011  [P2] GAP  facet F03  effort M
- Legacy: Legacy Faculty adds Reassign upcoming schedules action, uses same OTP, impersonate, suspend, delete; Faculty.js:803-935
- vNext now: vNext row has CollegePersonEditAction, ScopedMembershipLifecycleActions, SuperAdminFacultyScheduleReassignAction; admin/faculty/page.tsx:36-44
- Fix: Match legacy button/icon order, tooltip, widths, disabled-on-lookup while keeping supported reassignment

## G2-18-031-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy faculty table Name Department Mobile Email Type Gender Status Actions; Faculty.js:769-801
- vNext now: vNext generic Person/roles/status separate from academic directory and scoped faculty list; admin/people/page.tsx:28-87;admin/faculty/page.tsx:33-44
- Fix: Confirm registered faculty list shows Department Type Gender and mobile columns within authorized college only

## G2-18-031-039  [P2] GAP  facet F09  effort M
- Legacy: Legacy register in expandable section and full profile modal, Faculty reassign action popup; Students.js:1103-1130,982-989;Faculty.js:828-835,940-979
- vNext now: vNext PersonOnboardDialog and profile Dialog, reassignment component; person-onboard-dialog.tsx:120-153;admin/faculty/page.tsx:36-44
- Fix: Audit every trigger open/close, Escape, focus return, busy disable and mobile drawer sizing

## G2-18-031-069  [P2] GAP  facet F18  effort S
- Legacy: Legacy Faculty header Faculty, registration Register faculty, Type, Faculty updated successfully!; Faculty.js:769-784,940-952,465
- vNext now: vNext Registered Faculty, Register New Faculty, Faculty type/mentor checkbox and membership changes; admin/faculty/page.tsx:21-44;person-onboard-dialog.tsx:120-148,215-225
- Fix: Match visible faculty chrome while documenting multi-role changes

## G2-19-013-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy route prefix `/api/v2/faculty` exposes GET search/popular/colleges/college/id/department/id `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:30-35` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:80-93` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:173-232`
- vNext now: vNext mapped `/admin/faculty` page via AdminScopedReadPage and listAdminScopedPeople `src/app/(authenticated)/admin/faculty/page.tsx:14-44`
- Fix: Create compatible scoped faculty query adapter if old callers survive.

## G2-19-013-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy additional faculty type/category/exists/stats/refresh endpoints `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:249-381`
- vNext now: vNext faculty route renders selected-college directory only `src/app/(authenticated)/admin/faculty/page.tsx:17-44`
- Fix: Inventory actual endpoint consumers before retiring API routes.

## G2-19-013-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy controller has no page shell, returns Response DTO lists and maps `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:83-93` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:168-170`
- vNext now: vNext admin faculty page uses PageHeader/filters/status and cards `src/app/(authenticated)/admin/faculty/page.tsx:20-44` `src/components/admin/admin-scoped-read-page.tsx:91-126`
- Fix: Clone visual faculty search grouping and dropdown in consuming screens.

## G2-19-013-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy POST `/facultyId/select` records popularity and POST `/refresh` reloads cache `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:309-325` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:371-380`
- vNext now: vNext faculty page actions edit membership/schedule and import `src/app/(authenticated)/admin/faculty/page.tsx:21-44`
- Fix: Restore selection-tracking only if recommended/popular UI retained.

## G2-19-013-028  [P2] GAP  facet F10  effort M
- Legacy: Legacy `GET /search` with five query params `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:80-93`
- vNext now: vNext server listAdminScopedPeople(context,'FACULTY',query) `src/app/(authenticated)/admin/faculty/page.tsx:44-44` `src/modules/admin-ui/super-admin-scoped-people-service.ts:10-12`
- Fix: Expose compatible scoped GET endpoint only for extant clients.

## G2-19-013-029  [P2] GAP  facet F10  effort L
- Legacy: Legacy `GET /popular`, `/colleges`, `/college/{id}`, `/department/{id}` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:173-247`
- vNext now: vNext only selected-college faculty list and picker `src/app/(authenticated)/admin/faculty/page.tsx:14-44` `src/modules/courses/college-faculty-picker-service.ts:12-33`
- Fix: Implement required variant readers or document deprecation.

## G2-19-013-031  [P2] GAP  facet F10  effort M
- Legacy: Legacy POST `/{facultyId}/select` and `/refresh` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:309-325` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:371-380`
- vNext now: vNext page supports edit/bulk operations but no search-popularity mutation `src/app/(authenticated)/admin/faculty/page.tsx:21-44`
- Fix: Audit old consumers and authorization if reintroduced.

## G2-6-002-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy superadmin teachers route renders Faculty with selectedCollegeId and groupKey people `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:5-27`
- vNext now: vNext `/admin/faculty` renders AdminScopedReadPage and no identical legacy nested shell `src/app/(authenticated)/admin/faculty/page.tsx:13-44`
- Fix: Preserve selected-college People group navigation and faculty tab labeling

## G2-6-002-004  [P2] GAP  facet F02  effort M
- Legacy: Old page opens PeoplePageOverview followed register accordion and registered faculty card `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:940-980` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1275-1278`
- vNext now: New page uses PageHeader, intro disclosure, overview totals, filter form then list `src/app/(authenticated)/admin/faculty/page.tsx:20-35` `src/components/admin/admin-scoped-read-page.tsx:91-113`
- Fix: Move overview/registration/list into original relative order and headings

## G2-6-002-005  [P2] GAP  facet F02  effort M
- Legacy: Old inline single and bulk forms occupy parallel `lg=12` cols `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:975-981` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1111-1114`
- vNext now: New single onboard modal and bulk inline disclosure in separate intro `src/app/(authenticated)/admin/faculty/page.tsx:21-29`
- Fix: Restore two-column registration accordion at desktop while retaining secure API

## G2-6-002-006  [P2] GAP  facet F02  effort M
- Legacy: Old `Registered Faculty` is a Card with title, actions and table `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1273-1374`
- vNext now: New `Registered Faculty` is top-level PageHeader with row articles `src/app/(authenticated)/admin/faculty/page.tsx:33-44` `src/components/admin/admin-scoped-read-page.tsx:91-113` `src/components/admin/admin-scoped-read-page.tsx:245-265`
- Fix: Recreate distinct titled roster section and full-width table layout

## G2-6-002-007  [P2] GAP  facet F03  effort S
- Legacy: Old header CTA says `Register faculty` with PlusOutlined `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:950-957`
- vNext now: New header CTA says `Register New Faculty` `src/app/(authenticated)/admin/faculty/page.tsx:21-23` `src/components/admin/person-onboard-dialog.tsx:118-127`
- Fix: Use exact caption/icon and open inline accordion

## G2-6-002-008  [P2] GAP  facet F03  effort S
- Legacy: Old page header description explicitly refers to separate Faculty Assignment `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:940-949`
- vNext now: New description says OTP, access, contact fields instead `src/app/(authenticated)/admin/faculty/page.tsx:33-35`
- Fix: Restore exact overview description; place new privacy note elsewhere

## G2-6-002-023  [P2] GAP  facet F05  effort S
- Legacy: Old status picker placeholder `Any status` lists Active and Suspended `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1350-1353`
- vNext now: New status filter labels ALL, ACTIVE, SUSPENDED, ENDED `src/app/(authenticated)/admin/faculty/page.tsx:13-14` `src/components/admin/admin-scoped-read-page.tsx:118-123`
- Fix: Preserve old placeholder and readable status labels, retain ENDED as secondary extra

## G2-6-002-069  [P2] GAP  facet F14  effort M
- Legacy: Old roster export faculty.csv columns Name/Mobile/Email/Type/Gender/Status of visible data `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1283-1305`
- vNext now: New admin CSV export capped 250 and filename super-admin-faculty-ist.csv `src/app/(authenticated)/admin/faculty/page.tsx:33-35` `src/components/admin/admin-scoped-csv-control.tsx:4-23`
- Fix: Provide legacy visible export with same columns and filename alongside capped full matching export

## G2-6-002-074  [P2] GAP  facet F17  effort S
- Legacy: Old action icon buttons carry aria-label with faculty member's name `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:803-936`
- vNext now: New `More faculty actions` repeated disclosure per row without unique name `src/app/(authenticated)/admin/faculty/page.tsx:36-43`
- Fix: Name actions and disclosure with row title for screen readers

## G2-6-002-076  [P2] GAP  facet F18  effort S
- Legacy: Old section heading `Faculty` and roster `Registered Faculty` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:940-980` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1275-1278`
- vNext now: New top header `Registered Faculty` with no separate overview header `src/app/(authenticated)/admin/faculty/page.tsx:33-35`
- Fix: Restore hierarchy and exact headings

## G2-6-002-084  [P2] MISSING  facet F21  effort M
- Legacy: Old faculty autocomplete popularity telemetry from recordFacultySelection `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:291-316`
- vNext now: New directory only DB read; no selection telemetry in page `src/modules/admin-ui/super-admin-scoped-people-service.ts:77-91` `src/app/(authenticated)/admin/faculty/page.tsx:36-44`
- Fix: Reintroduce consent-aware scoped selection tracking if requirement remains

## G2-6-003-001  [P2] GAP  facet F01  effort S
- Legacy: Old route `/superadmin/teachers` wraps SuperAdminGroupShell people `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:23-32`
- vNext now: New route `/admin/faculty` under admin/layout `src/app/(authenticated)/admin/faculty/page.tsx:13-20` `src/app/(authenticated)/admin/layout.tsx:6-15`
- Fix: Add legacy URL redirect and retain people group active selection

## G2-6-003-003  [P2] GAP  facet F01  effort S
- Legacy: Old missing college alert exact `Select a college to continue` and `Choose a college in the header above to see its faculty.` `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:10-20`
- vNext now: New EmptyState starts with `Select a college to continue`, but description resolved via title `Registered Faculty` rather than `Faculty` `src/components/admin/admin-scoped-read-page.tsx:54-57` `src/app/(authenticated)/admin/faculty/page.tsx:33-35`
- Fix: Use exact former description when no college selected

## G2-6-003-004  [P2] GAP  facet F02  effort M
- Legacy: Old wrapper outer CSS classes `ln-module admin-list-page` `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:11-12` `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:23-28`
- vNext now: New page wrapper `min-w-0 space-y-4 md:space-y-6` `src/app/(authenticated)/admin/faculty/page.tsx:20-21`
- Fix: Match original page canvas dimensions and `admin-list-page` density tokens

## G2-6-003-005  [P2] GAP  facet F02  effort M
- Legacy: Old wrapper embeds PageShell title group and tabs above Faculty content `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:20-29` `docs/legacy-source/frontend/src/components/Common/PageShell.jsx:50-88`
- vNext now: New layout puts standalone tabs before nested AdminScopedReadPage PageHeader `src/app/(authenticated)/admin/layout.tsx:11-14` `src/app/(authenticated)/admin/faculty/page.tsx:20-34`
- Fix: Restore People group title hierarchy and same content padding

## G2-6-003-009  [P2] GAP  facet F03  effort S
- Legacy: Old Faculty nested overview has `Register faculty` CTA `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:940-956`
- vNext now: New `PersonOnboardDialog` button `Register New Faculty` `src/app/(authenticated)/admin/faculty/page.tsx:21-23` `src/components/admin/person-onboard-dialog.tsx:118-126`
- Fix: Preserve exact CTA phrase/icon

## G2-6-003-022  [P2] GAP  facet F09  effort M
- Legacy: Old nested registration accordions/modals mounted within Faculty wrapper `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:25-27` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:965-975` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1378-1601`
- vNext now: New intro bulk disclosure, PersonOnboardDialog and separate More actions disclosure `src/app/(authenticated)/admin/faculty/page.tsx:21-43`
- Fix: Match collapse/modal trigger hierarchy and close states

## G2-6-003-032  [P2] GAP  facet F14  effort M
- Legacy: Old Faculty CSV five columns with Faculty Type `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:746-755`
- vNext now: New admin bulk CSV sample four fields `src/app/(authenticated)/admin/faculty/page.tsx:25-28` `src/components/admin/person-onboard-dialog.tsx:75-84`
- Fix: Restore fifth Faculty Type template column and validation rules

## G2-6-003-035  [P2] GAP  facet F16  effort M
- Legacy: Old `ln-module admin-list-page` and PageShell apply legacy breakpoints `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:24-28` `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:26-30`
- vNext now: New responsive Tailwind wrapper `space-y-4 md:space-y-6` `src/app/(authenticated)/admin/faculty/page.tsx:20-21`
- Fix: Match tablet gutters, section width, mobile wrapping

## G2-6-003-040  [P2] GAP  facet F18  effort S
- Legacy: Old no-scope description `Choose a college in the header above to see its faculty.` `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:15-16`
- vNext now: New directory produces `...see its Registered Faculty.` due page title `src/components/admin/admin-scoped-read-page.tsx:54-57` `src/app/(authenticated)/admin/faculty/page.tsx:33-35`
- Fix: Hardcode exact faculty description in no-college state

## G2-15-027-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:49-53 API scope /api/v1/faculty; individual endpoints
- vNext now: src/app/(authenticated)/college/faculty/page.tsx:1-8 role directory and src/app/(authenticated)/admin/faculty/page.tsx:20-44 admin faculty page
- Fix: Map each legacy endpoint to People/Academics/Auth routes and preserve legacy navigation entry points.
