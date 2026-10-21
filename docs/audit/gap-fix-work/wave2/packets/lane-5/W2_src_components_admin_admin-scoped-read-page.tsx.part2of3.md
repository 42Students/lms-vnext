# Work packet (wave 2): edit src/components/admin/admin-scoped-read-page.tsx (part 2 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-4/superadmin-faculty-assignment.md, docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-19-001-062  [P2] GAP  facet F13  effort M
- Legacy: Legacy row loading uses AntD Table loading spinner `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1572-1577`
- vNext now: vNext server-page navigation with async list read; no row-level Table spinner `src/components/admin/admin-scoped-read-page.tsx:58-67`,247-263
- Fix: Add table loading/skeleton state during filter/refresh transitions.

## G2-19-001-071  [P2] GAP  facet F16  effort M
- Legacy: Legacy `Row` uses xs24 sm12, lg12 for parallel cards, AntD table x scroll and right-fixed actions at `screens.md` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1128-1130`,962-964,1572-1584
- vNext now: vNext responsive full-width stacked sections and article cards; action buttons wrap at sm `src/app/(authenticated)/admin/students/page.tsx:70-90`; `src/components/admin/admin-scoped-read-page.tsx:247-263`
- Fix: Match legacy responsive breakpoints, wide table scroll and pinned actions at >=md.

## G2-19-001-072  [P2] GAP  facet F16  effort M
- Legacy: Legacy search/filters have specified pixel widths with wrap `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1482-1515`
- vNext now: vNext filters grid 1/2/3 columns with full-width controls `src/components/admin/admin-scoped-read-page.tsx:113-124`,154-189
- Fix: Audit 1280/768/375 layouts and reproduce legacy widths/gutters.

## G2-19-001-073  [P2] GAP  facet F17  effort S
- Legacy: Legacy row icon buttons have per-student `aria-label`s and tooltips/titles `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:966-1025`,1056-1084
- vNext now: vNext uses text action buttons and Open details link `src/app/(authenticated)/admin/students/page.tsx:90`; `src/components/college/college-person-edit-action.tsx:82-88`; `src/components/admin/admin-scoped-read-page.tsx:255-257`
- Fix: Preserve distinguishable student-specific accessible names for repeated row actions.

## G2-4-008-003  [P2] GAP  facet F01  effort M
- Legacy: No college shows warning `Select a college to continue`, description `Choose a college in the header above to see its faculty assignments.` (`docs/legacy-source/frontend/src/pages/superadmin/faculty-assignment.js:10-21`)
- vNext now: Title matches but helper formats `Faculty Assignments` as generic `people directory` due singular-only conditional. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:29-31;src/components/admin/admin-scoped-read-page.tsx:54-57`)
- Fix: Handle plural Faculty Assignments in no-college helper; render old warning style.

## G2-4-008-004  [P2] GAP  facet F02  effort M
- Legacy: Overview: PeoplePageOverview plus two-column Create teaching assignment card (lg10) / Current teaching assignments (lg14). (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-402;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:476-514`)
- vNext now: Server AdminScopedReadPage full-width article list; intro collapsible create controls, no side-by-side cards. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:23-45;src/components/admin/admin-scoped-read-page.tsx:91-94;src/components/admin/admin-scoped-read-page.tsx:247-264`)
- Fix: Recreate legacy card geometry and title positions.

## G2-4-008-005  [P2] MISSING  facet F02  effort M
- Legacy: Four overview metrics Assignments, Active, Primary instructors, Classes covered. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-393`)
- vNext now: Stats conditional on peopleFilters; this page passes no peopleFilters, so all four absent. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:24-45;src/components/admin/admin-scoped-read-page.tsx:95-108`)
- Fix: Pass faculty-assignment metric model and render exact four tiles.

## G2-4-008-009  [P2] GAP  facet F03  effort M
- Legacy: AdminTableToolbar refresh and export in roster Card extra. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-491`)
- vNext now: Header-level Export CSV and Refresh provided by generic directory. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:29-30;src/components/admin/admin-scoped-read-page.tsx:77-94`)
- Fix: Place both controls within legacy roster card header.

## G2-4-008-010  [P2] GAP  facet F03  effort M
- Legacy: Role rendered green PRIMARY, blue CO_TEACHER, orange TA tags; Active Yes green/No red. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:366-370`)
- vNext now: New role inside detail text and ACTIVE/ENDED StatusBadge on item article. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:67-73;src/components/admin/admin-scoped-read-page.tsx:247-254`)
- Fix: Restore role and active chips/colors/labels in row.

## G2-4-008-011  [P2] GAP  facet F03  effort M
- Legacy: Class dropdown `Filter by class` width170 with clear action. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-483`)
- vNext now: Generic directory filter `All classes` in form, not toolbar. (`src/components/admin/admin-scoped-read-page.tsx:179-183`)
- Fix: Match input size, placeholder and toolbar position.

## G2-4-008-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy fetches all assignments across college then client page 10/25/50/100, localStorage persists choice. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:95-101;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:504-510;docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:47-61`)
- vNext now: New DB server page-size 10/25/50/100 with query param, no persisted page-size preference. (`src/components/admin/admin-scoped-read-page.tsx:184-199;src/modules/admin-ui/super-admin-faculty-assignments-service.ts:57-65`)
- Fix: Persist page-size preference and show AntD total range.

## G2-4-008-049  [P2] GAP  facet F13  effort M
- Legacy: Legacy initial table `TableSkeleton` rows8 columns8; refresh indicates Refreshing faculty assignments. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:495-510`)
- vNext now: Server route reads on request and no matching inline skeleton on AdminScopedReadPage. (`src/components/admin/admin-scoped-read-page.tsx:58-67;src/components/admin/admin-scoped-read-page.tsx:91-94`)
- Fix: Add legacy loading/skeleton and refresh announcement where relevant.

## G2-4-008-050  [P2] GAP  facet F13  effort M
- Legacy: No rows `No assignments found.`; load errors `Could not load faculty assignments` and Retry. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:495-510`)
- vNext now: New EmptyState `No matching records`, generic `Directory unavailable` and Retry loading directory. (`src/components/admin/admin-scoped-read-page.tsx:61-67;src/components/admin/admin-scoped-read-page.tsx:247-259`)
- Fix: Use domain-specific old strings, distinguish filtered no-match.

## G2-4-008-051  [P2] GAP  facet F13  effort M
- Legacy: On refreshing current scope and request fails old rows kept, current warning `Couldn't refresh faculty assignments`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:135-158;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:495-503`)
- vNext now: Server exception triggers generic error without last-loaded rows. (`src/components/admin/admin-scoped-read-page.tsx:58-67`)
- Fix: Maintain last-good scoped data and inline retry if UX parity demanded.

## G2-4-008-056  [P2] GAP  facet F16  effort M
- Legacy: Legacy desktop AntD two-card Row Col xs24 lg10/lg14; form has sm12 columns. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:400-476;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:476-514`)
- vNext now: New full-width responsive form md2 columns above article rows. (`src/components/admin/super-admin-faculty-assignment-create.tsx:69-117;src/components/admin/admin-scoped-read-page.tsx:247-263`)
- Fix: Reproduce legacy lg card split and form breakpoint.

## G2-4-008-057  [P2] GAP  facet F16  effort M
- Legacy: Legacy table scroll x=max-content preserving 8 columns even narrow widths. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:504-510`)
- vNext now: New responsive article rows without column table and explicit scroll. (`src/components/admin/admin-scoped-read-page.tsx:247-263`)
- Fix: Restore eight-column horizontal scroll at narrow widths.

## G2-4-008-062  [P2] GAP  facet F18  effort M
- Legacy: Old `Create Assignment`, `Edit`, `Delete`, `Save Changes`, `Filter by class`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:471-483;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-520`)
- vNext now: New `Create teaching assignment`, `Assign faculty`, `Edit role`, `End`, `All classes`. (`src/components/admin/super-admin-faculty-assignment-create.tsx:59-64;src/components/admin/super-admin-faculty-assignment-create.tsx:111-117;src/components/admin/super-admin-faculty-assignment-create.tsx:151-169;src/components/courses/admin-course-actions.tsx:548-555;src/components/admin/admin-scoped-read-page.tsx:179-183`)
- Fix: Match exact legacy action copy or scope-approved variants.

## G2-4-011-002  [P2] GAP  facet F01  effort S
- Legacy: No selected college shows warning Select a college to continue and scoped helper sentence. (`docs/legacy-source/frontend/src/pages/superadmin/faculty-assignment.js:10-22`)
- vNext now: Generic EmptyState replaces warning Alert. (`src/components/admin/admin-scoped-read-page.tsx:54-57`)
- Fix: Use warning Alert and exact legacy sentence.

## G2-4-011-007  [P2] GAP  facet F02  effort M
- Legacy: Roster titled Current teaching assignments has compact table inside right Card. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:476-512`)
- vNext now: Directory uses bordered article rows without table headers. (`src/components/admin/admin-scoped-read-page.tsx:247-259`)
- Fix: Render compact eight-column roster table.

## G2-4-011-012  [P2] GAP  facet F03  effort M
- Legacy: Semester blue Sem N, role green/blue/orange and active Yes/No green/red tags. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:366-369`)
- vNext now: StatusBadge ACTIVE/ENDED plus plain text detail lines. (`src/components/admin/admin-scoped-read-page.tsx:249-255`; `src/modules/admin-ui/super-admin-faculty-assignments-service.ts:70-72`)
- Fix: Use three legacy tag columns and palette.

## G2-4-011-013  [P2] GAP  facet F03  effort M
- Legacy: Header toolbar combines class filter, Refresh and CSV Export. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-490`)
- vNext now: New header and directory expose generic search, filter, refresh and CSV. (`src/components/admin/admin-scoped-read-page.tsx:89-121`; `src/components/admin/admin-scoped-read-page.tsx:213-221`)
- Fix: Place class select, Refresh and Export inside roster-card header.

## G2-4-011-021  [P2] GAP  facet F05  effort M
- Legacy: Eight columns Faculty Course Class Semester Year Role Active Actions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-381`)
- vNext now: Directory renders article list without column headers. (`src/components/admin/admin-scoped-read-page.tsx:247-259`)
- Fix: Restore exactly eight columns and ordering.

## G2-4-011-022  [P2] GAP  facet F05  effort M
- Legacy: Class filter is 170px Select placeholder Filter by class with allowClear. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-483`)
- vNext now: Shared directory class option filter is in generic filter area. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:19-20`; `src/components/admin/admin-scoped-read-page.tsx:112-199`)
- Fix: Match location, width, placeholder and clear behavior.

## G2-4-011-024  [P2] GAP  facet F05  effort S
- Legacy: Client paging default 25 and options 10,25,50,100 remembered in localStorage. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:19-20`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:81-101`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:504-510`)
- vNext now: Server paging same sizes, URL state, no localStorage preference in shared directory. (`src/modules/admin-ui/super-admin-read-directory-model.ts:2-14`; `src/components/admin/admin-scoped-read-page.tsx:184-195`)
- Fix: Persist last page size under legacy key.

## G2-4-011-025  [P2] GAP  facet F05  effort S
- Legacy: Pagination footer says start-end of total. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:504-510`)
- vNext now: Summary says N matching records, page X of Y, rows/page. (`src/components/admin/admin-scoped-read-page.tsx:220-221`)
- Fix: Reproduce range total copy.

## G2-4-011-060  [P2] GAP  facet F13  effort M
- Legacy: Initial load displays 8×8 TableSkeleton, refreshing keeps old data. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:493-510`)
- vNext now: Server renders list/empty/error, no table skeleton refresh state. (`src/components/admin/admin-scoped-read-page.tsx:58-67`; `src/components/admin/admin-scoped-read-page.tsx:247-259`)
- Fix: Restore skeleton and retained-data refresh indicator.

## G2-4-011-061  [P2] GAP  facet F13  effort M
- Legacy: Failed refresh gives Couldn't refresh faculty assignments and keeps data for same filter. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:141-157`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:495-499`)
- vNext now: Page-level Directory unavailable replaces prior list. (`src/components/admin/admin-scoped-read-page.tsx:58-67`)
- Fix: Keep stale current-scope table with retry banner.

## G2-4-011-062  [P2] GAP  facet F13  effort S
- Legacy: Empty table says No assignments found. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:504-510`)
- vNext now: Empty directory No matching records. (`src/components/admin/admin-scoped-read-page.tsx:258-259`)
- Fix: Use exact legacy empty text.

## G2-4-011-068  [P2] GAP  facet F16  effort M
- Legacy: Table uses horizontal max-content scroll on narrow viewports. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:504-510`)
- vNext now: New cards/rows wrap fields, no table horizontal scroll. (`src/components/admin/admin-scoped-read-page.tsx:247-259`)
- Fix: Restore scrollable compact table with touch affordance.

## G2-4-011-072  [P2] GAP  facet F18  effort S
- Legacy: Roster heading Current teaching assignments, class placeholder Filter by class. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:476-483`)
- vNext now: Directory filters and generic list summary differ. (`src/components/admin/admin-scoped-read-page.tsx:112-121`; `src/components/admin/admin-scoped-read-page.tsx:220-221`)
- Fix: Restore exact heading and placeholder.

## G2-6-002-002  [P2] GAP  facet F01  effort S
- Legacy: Old no-college scope alert says `Select a College to manage Faculty` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:958-965`
- vNext now: New empty state says `Select a college to continue` `src/components/admin/admin-scoped-read-page.tsx:54-57`
- Fix: Use shared legacy scoped warning copy for superadmin faculty specifically

## G2-6-002-004  [P2] GAP  facet F02  effort M
- Legacy: Old page opens PeoplePageOverview followed register accordion and registered faculty card `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:940-980` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1275-1278`
- vNext now: New page uses PageHeader, intro disclosure, overview totals, filter form then list `src/app/(authenticated)/admin/faculty/page.tsx:20-35` `src/components/admin/admin-scoped-read-page.tsx:91-113`
- Fix: Move overview/registration/list into original relative order and headings

## G2-6-002-006  [P2] GAP  facet F02  effort M
- Legacy: Old `Registered Faculty` is a Card with title, actions and table `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1273-1374`
- vNext now: New `Registered Faculty` is top-level PageHeader with row articles `src/app/(authenticated)/admin/faculty/page.tsx:33-44` `src/components/admin/admin-scoped-read-page.tsx:91-113` `src/components/admin/admin-scoped-read-page.tsx:245-265`
- Fix: Recreate distinct titled roster section and full-width table layout

## G2-6-002-019  [P2] GAP  facet F05  effort L
- Legacy: Old table has eight columns incl Name Department Mobile Email Type Gender Status Actions `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:769-802`
- vNext now: New uses stacked article rows with name/status/subtitle/details/actions `src/components/admin/admin-scoped-read-page.tsx:245-265`
- Fix: Render same column table with responsive stacking and pinned right Actions

## G2-6-002-021  [P2] GAP  facet F05  effort M
- Legacy: Old Ant Table default 25, sizes 25/50/100/200 `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1362-1370`
- vNext now: New select options 10/25/50/100 and model max100 `src/components/admin/admin-scoped-read-page.tsx:180-190` `src/modules/admin-ui/super-admin-read-directory-model.ts:10-15`
- Fix: Offer 200 or explain intentional server cap separately; align page size list

## G2-6-002-022  [P2] GAP  facet F05  effort M
- Legacy: Old Department select placeholder `All departments` and Type select `All types` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1343-1350`
- vNext now: New advanced Department select and free-text Faculty type `src/components/admin/admin-scoped-read-page.tsx:154-165`
- Fix: Restore type dropdown from actual enum and original placeholders

## G2-6-002-023  [P2] GAP  facet F05  effort S
- Legacy: Old status picker placeholder `Any status` lists Active and Suspended `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1350-1353`
- vNext now: New status filter labels ALL, ACTIVE, SUSPENDED, ENDED `src/app/(authenticated)/admin/faculty/page.tsx:13-14` `src/components/admin/admin-scoped-read-page.tsx:118-123`
- Fix: Preserve old placeholder and readable status labels, retain ENDED as secondary extra

## G2-6-002-026  [P2] GAP  facet F05  effort S
- Legacy: Old toolbar counts `N faculty` or `N of M faculty` after client filters `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1353-1360`
- vNext now: New says total matching records, page count and page size `src/components/admin/admin-scoped-read-page.tsx:202-220`
- Fix: Show `visible of total faculty` counter in roster toolbar

## G2-6-002-062  [P2] GAP  facet F12  effort S
- Legacy: Old roster `filterType` options derived from loaded faculty, alphabetically sorted enum codes `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:758-761`
- vNext now: New faculty type is free-text with max128 `src/components/admin/admin-scoped-read-page.tsx:162-165`
- Fix: Use distinct type options in sorted order and normalize legacy labels

## G2-6-002-063  [P2] GAP  facet F13  effort S
- Legacy: Old `Could not load faculty` banner with Retry and preserved old data `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:123-136` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1317-1320`
- vNext now: New directory catches loader failure and shows `Directory unavailable` with retry link `src/components/admin/admin-scoped-read-page.tsx:58-67`
- Fix: Restore faculty-specific error wording and preserve filter state on retry
