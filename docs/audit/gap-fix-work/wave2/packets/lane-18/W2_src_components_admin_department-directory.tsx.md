# Work packet (wave 2): edit src/components/admin/department-directory.tsx

32 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/department-search-controller.md, docs/audit/gap2/lane-6/department.md, docs/audit/gap2/lane-9/college-admin-departments.md, docs/audit/gap2/lane-9/superadmin-departments.md

## G2-20-013-008  [P2] GAP  facet F04  effort S
- Legacy: Popular default limit10, by-college default limit50 `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:117-124,134-142`
- vNext now: Single pageSize10 options10,25,50,100; no popularity query `src/components/admin/department-directory.tsx:59-65,85-92`
- Fix: Add endpoint-specific defaults/picker caps and preserve popular ranking

## G2-20-013-012  [P2] MISSING  facet F05  effort S
- Legacy: Legacy GET /categories distinct collegeName and /category string selection `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:149-190`
- vNext now: New directory has neither categories list nor college category selection `src/components/admin/department-directory.tsx:69-106`
- Fix: Offer college category filter to cross-tenant SA when applicable

## G2-6-020-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy Departments page has create card left, existing/list card right (Departments.js:333-417 per docs/audit/pages/college/academic-setup.md:1-17).
- vNext now: vNext create form unboxed and separate directory section (department-create-form.tsx:51-83; department-directory.tsx:69-72).
- Fix: Clone legacy two-card section structure at desktop; maintain mobile stacking.

## G2-6-020-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy repository paged list uses explicit countQuery (DepartmentRepository.java:17-25).
- vNext now: vNext service list all then browser pages 10/25/50/100 (departments/service.ts:235-251; department-directory.tsx:59-65,85-92).
- Fix: Use server pages for high department counts if endpoint parity required; retain count metadata.

## G2-6-020-046  [P2] GAP  facet F16  effort M
- Legacy: Legacy card desktop xs24/lg split and compact table scroll (docs/audit/pages/college/academic-setup.md:1-17).
- vNext now: vNext forms responsive sm grid, directory disclosure and scrolling list (department-create-form.tsx:51-76; department-directory.tsx:69-101).
- Fix: Clone legacy lg side-by-side cards, responsive phone stacked content and touch size.

## G2-6-020-050  [P2] GAP  facet F19  effort M
- Legacy: Legacy paged backend supports max size 100 (DepartmentController.java:225-246).
- vNext now: vNext service loads all department rows then page 10 client-side (departments/service.ts:235-250; department-directory.tsx:59-65).
- Fix: Use count/page SQL for high-scale and consistent row totals; preserve max100.

## G2-9-006-006  [P2] GAP  facet F02  effort M
- Legacy: Table toolbar within Existing Departments card head (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:391-417`)
- vNext now: Search and View options disclosure inside section (`src/components/admin/department-directory.tsx:67-110`)
- Fix: Align search/export/refresh to card extra.

## G2-9-006-008  [P2] GAP  facet F03  effort M
- Legacy: Search small 220px input, Export CSV and Refresh icon buttons (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:357-392`)
- vNext now: Full-width search, View options disclosure (`src/components/admin/department-directory.tsx:70-111`)
- Fix: Render compact 220px toolbar with export and Refresh visibly.

## G2-9-006-009  [P2] GAP  facet F03  effort M
- Legacy: Count chips Tag blue/gray per nonzero, tooltip on contents (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:273-311`)
- vNext now: Plain dotted text with hover title (`src/components/admin/department-directory.tsx:24-36`)
- Fix: Restore contents chips and tooltip.

## G2-9-006-013  [P2] GAP  facet F04  effort M
- Legacy: Contents 0 program/course/faculty chips, title deletion explanation (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:267-310`)
- vNext now: Counts as 0 programs · 0 courses · 0 faculty plain text (`src/components/admin/department-directory.tsx:26-36`)
- Fix: Retain singular labels and colored chip indicators.

## G2-9-006-014  [P2] GAP  facet F04  effort M
- Legacy: Counts loading ellipsis when not yet resolved (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:268-274`)
- vNext now: Usage absent shows em dash + note (`src/components/admin/department-directory.tsx:16-36`)
- Fix: Match skeleton/count pending while preserving failure dash.

## G2-9-006-018  [P2] GAP  facet F05  effort M
- Legacy: Ant Table small x:max-content scroll (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:388-397`)
- vNext now: Responsive DataTable cells/mobile priority (`src/components/admin/department-directory.tsx:116-132`)
- Fix: Check horizontal content overflow on narrow screens.

## G2-9-006-054  [P2] GAP  facet F14  effort M
- Legacy: Export action visible in toolbar (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:384-400`)
- vNext now: Export inside View options disclosure (`src/components/admin/department-directory.tsx:84-111`)
- Fix: Restore always-visible compact Export CSV.

## G2-9-006-059  [P2] GAP  facet F16  effort M
- Legacy: Table horizontal x:max-content (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:398-416`)
- vNext now: DataTable responsive mobilePriority (`src/components/admin/department-directory.tsx:114-127`)
- Fix: Verify no column loss on 375px; original scroll behavior.

## G2-9-006-062  [P2] GAP  facet F17  effort M
- Legacy: Contents Tooltip explains delete blocked (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:309-315`)
- vNext now: Span title explaining archive counts (`src/components/admin/department-directory.tsx:24-36`)
- Fix: Use keyboard-accessible Tooltip rather than hover-only title.

## G2-9-006-067  [P2] GAP  facet F18  effort M
- Legacy: Couldn't refresh departments, Refreshing departments… (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:371-397`)
- vNext now: No Refresh wording/control (`src/components/admin/department-directory.tsx:66-111`)
- Fix: Restore exact refresh states.

## G2-9-024-006  [P2] GAP  facet F02  effort M
- Legacy: Existing Departments card header holds search, export, refresh `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:373-395`
- vNext now: Unframed section and collapsed View options `src/components/admin/department-directory.tsx:69-119`
- Fix: Put toolbar in card extra region, expose actions by default

## G2-9-024-009  [P2] GAP  facet F03  effort S
- Legacy: Export CSV Download icon and Refresh Reload icon visible `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:386-391`
- vNext now: Export hidden in View options; no direct Refresh button `src/components/admin/department-directory.tsx:99-119`
- Fix: Restore two small icon actions next to search

## G2-9-024-010  [P2] GAP  facet F03  effort S
- Legacy: Blue/neutral per-dependent count Tags with tooltip `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:257-274`
- vNext now: Plain single text: n programs · n courses · n faculty `src/components/admin/department-directory.tsx:29-40`
- Fix: Render three colored chips and tooltip; unknown as ellipsis

## G2-9-024-012  [P2] GAP  facet F04  effort S
- Legacy: Department Name, Contents chips, Actions data columns `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:245-275`
- vNext now: Same three fields but actions heading sr-only `src/components/admin/department-directory.tsx:21-53`
- Fix: Display literal Actions column header and count chips

## G2-9-024-013  [P2] GAP  facet F04  effort S
- Legacy: Unloaded dependency count displays ellipsis `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:257-264`
- vNext now: Failed/null counts rendered as em dash in sentence `src/components/admin/department-directory.tsx:16-40`
- Fix: Use ellipsis for loading and distinct unavailable indicator

## G2-9-024-018  [P2] GAP  facet F05  effort S
- Legacy: Search placeholder Search departments, compact width220 allowClear `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:379-385`
- vNext now: Full-width labelled input and separate Clear search button `src/components/admin/department-directory.tsx:75-92`
- Fix: Match compact search/clear affordance

## G2-9-024-019  [P2] GAP  facet F05  effort M
- Legacy: Ant Table pageSize10, size chooser, show x-y of total `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:408-415`
- vNext now: Custom previous/next pager and size changer inside View options `src/components/admin/department-directory.tsx:58-68,137-175`
- Fix: Restore legacy paginator position and controls

## G2-9-024-020  [P2] GAP  facet F05  effort M
- Legacy: Ant Table horizontal scroll max-content, small density `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:408-414`
- vNext now: Responsive DataTable with priority columns `src/components/admin/department-directory.tsx:21-53,120-138`
- Fix: Match desktop density and scrolling

## G2-9-024-049  [P2] GAP  facet F13  effort S
- Legacy: 8-row skeleton and No departments found. Create a college first... `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:405-416`
- vNext now: Same empty text, but no table skeleton within component `src/components/admin/department-directory.tsx:136-148`
- Fix: Keep legacy table skeleton and loading label

## G2-9-024-054  [P2] GAP  facet F16  effort M
- Legacy: Desktop lg10/lg14 cards with 24px gutter, xs stacked `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:331-333,373-375`
- vNext now: Single-column cards omitted; horizontal sm form and responsive list `src/components/admin/department-create-form.tsx:49-90` `src/components/admin/department-directory.tsx:69-119`
- Fix: Recreate desktop 10/14, maintain mobile tap targets

## G2-9-024-058  [P2] GAP  facet F18  effort S
- Legacy: Search departments, Export CSV, Refresh labels `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:379-391`
- vNext now: Search/Export exist but Refresh is absent `src/components/admin/department-directory.tsx:75-119`
- Fix: Restore Refresh visible

## G2-20-013-003  [P3] GAP  facet F02  effort S
- Legacy: Backend returns Response(status,message,data) not HTML sections `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:112-114`
- vNext now: New DepartmentDirectory renders page section/card/table and status line `src/components/admin/department-directory.tsx:69-106`
- Fix: Treat endpoint-to-component comparison as data/API, not same UI page

## G2-20-013-014  [P3] MISSING  facet F06  effort S
- Legacy: Selecting department POST /{deptId}/select tracks usage; no input body `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:193-206`
- vNext now: New department actions trigger CRUD, not an analytics select call `src/components/admin/department-directory.tsx:46-51`
- Fix: If popularity metric still used, record selection on actual picker choice

## G2-20-013-031  [P3] GAP  facet F18  effort S
- Legacy: Success message 'Popular departments retrieved', 'Selection recorded' `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:129-131,204-205`
- vNext now: Client shows 'N of N results', no select confirmation `src/components/admin/department-directory.tsx:103-105`
- Fix: Match API response text for compatible callers

## G2-20-013-032  [P3] GAP  facet F18  effort S
- Legacy: Search query field named 'query', not 'search' `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/departments/DepartmentSearchController.java:63-68`
- vNext now: New component state named search and input placeholder 'Search departments' `src/components/admin/department-directory.tsx:59,74-79`
- Fix: Adapt query param from client to API when replacing search route

## G2-9-024-014  [P3] GAP  facet F04  effort S
- Legacy: Singular program/course and plural faculty labels `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:260-271`
- vNext now: Always programs/courses/faculty after counts `src/components/admin/department-directory.tsx:34-39`
- Fix: Apply legacy singular/plural chip labels
