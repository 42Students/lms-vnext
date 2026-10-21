# Work packet (wave 2): edit src/components/admin/admin-program-directory.tsx (part 2 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-programs.md, docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-13/new-program.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md

## G2-9-018-007  [P2] GAP  facet F03  effort S
- Legacy: Create button includes PlusOutlined and exact Create Program label `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:282-287`
- vNext now: Create Program label but lacks plus icon; pending text Creating… `src/components/admin/admin-program-directory.tsx:181-185`
- Fix: Add plus icon; match label and loading affordance.

## G2-9-018-009  [P2] GAP  facet F03  effort S
- Legacy: Linked-record Tag chips with blue/nonzero and gray/zero plus tooltip `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:219-225`
- vNext now: Disclosure with plain sentence and title attr `src/components/admin/admin-program-directory.tsx:55-64`
- Fix: Restore three individual colored count chips and relationship tooltip.

## G2-9-018-010  [P2] GAP  facet F03  effort S
- Legacy: Toolbar has search, Refresh, export and count `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:292-298`
- vNext now: Search plus collapsed View options for rows/export/refresh `src/components/admin/admin-program-directory.tsx:191-222`
- Fix: Show Refresh and Export beside search without a View options disclosure.

## G2-9-018-013  [P2] GAP  facet F04  effort S
- Legacy: Department fallback is Name unavailable `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:217-218`
- vNext now: Department cell uses item.departmentName without fallback `src/components/admin/admin-program-directory.tsx:52-53`
- Fix: Show Name unavailable when department lookup is missing.

## G2-9-018-014  [P2] GAP  facet F04  effort S
- Legacy: Contents unavailable initially Checking dependencies… `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:219-221`
- vNext now: Contents null renders em dash `src/components/admin/admin-program-directory.tsx:55-64`
- Fix: Show progressive dependency-loading status rather than implying empty.

## G2-9-018-016  [P2] GAP  facet F05  effort S
- Legacy: Columns Program Name, Duration, Department, Contents, Actions `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:213-227`
- vNext now: Columns Program, Department, Duration, Contents, Actions `src/components/admin/admin-program-directory.tsx:42-79`
- Fix: Move Duration before Department and label first column Program Name.

## G2-9-018-019  [P2] GAP  facet F05  effort S
- Legacy: Initial page size state 25, choices 10/25/50/100 `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:13-15,42-44`
- vNext now: Initial size 10, choices 10/25/50/100 `src/components/admin/admin-program-directory.tsx:25-35,202-205`
- Fix: Change default to 25 and use legacy persisted preference.

## G2-9-018-021  [P2] GAP  facet F05  effort M
- Legacy: Ant pagination changes page and size, shows x-y of total `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:310-319`
- vNext now: Custom Prev/Next, Page x of y; total strip separate `src/components/admin/admin-program-directory.tsx:222-244`
- Fix: Use legacy pagination/page-size selector location and labels.

## G2-9-018-022  [P2] GAP  facet F05  effort M
- Legacy: Ant Table small with scroll x max-content `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:310-312`
- vNext now: Responsive DataTable with mobile priorities `src/components/admin/admin-program-directory.tsx:42-79,223-231`
- Fix: Verify/fix five-column responsive overflow and header density.

## G2-9-018-023  [P2] GAP  facet F05  effort S
- Legacy: Search empty message exact No matching programs. Clear search to see all. `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:319`
- vNext now: Search empty says No matching programs. `src/components/admin/admin-program-directory.tsx:225-230`
- Fix: Restore full empty-search recovery text.

## G2-9-018-025  [P2] GAP  facet F06  effort M
- Legacy: Department Ant searchable select with loading/unavailable placeholders `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:257-265`
- vNext now: Native Select fixed Select department option `src/components/admin/admin-program-directory.tsx:153-164`
- Fix: Add searchable select and asynchronous status placeholders.

## G2-9-018-026  [P2] GAP  facet F06  effort S
- Legacy: Program name placeholder e.g., B.Tech Computer Science `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:277-281`
- vNext now: Placeholder e.g. Computer Science Engineering `src/components/admin/admin-program-directory.tsx:165-168`
- Fix: Use exact legacy placeholder punctuation/text.

## G2-9-018-027  [P2] GAP  facet F06  effort S
- Legacy: Duration defaults 4, numeric min1 max10 addon Years `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:282-285`
- vNext now: Defaults 4 and number min1 max10, no visual Years addon `src/components/admin/admin-program-directory.tsx:94,175-180`
- Fix: Add visible Years suffix while retaining numeric constraints.

## G2-9-018-042  [P2] GAP  facet F10  effort M
- Legacy: POST /api/v1/new-program/create with name, dept_id,duration_years `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:113-120` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:59-83`
- vNext now: POST /api/academics/programs with UUID departmentId, name, code,durationTerms, returns 201 `src/components/admin/admin-program-directory.tsx:109-125` `src/app/api/academics/programs/route.ts:28-36`
- Fix: Keep UI years while transparently converting to terms; verify API error contract.

## G2-9-018-049  [P2] GAP  facet F12  effort M
- Legacy: Legacy year duration 1..10 in UI and *2 batch/semester maximum `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:282-284` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:113-136`
- vNext now: Terms stored between 1..24; create UI years 1..10 and doubled `src/modules/academics/college-program-mutation-model.ts:1-9` `src/components/admin/admin-program-directory.tsx:104-111`
- Fix: Prevent mismatched 11-12 years via other routes or explain larger model range.

## G2-9-018-053  [P2] GAP  facet F13  effort S
- Legacy: No programs found. Create a department first. `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:319`
- vNext now: No programs yet. Create the first program using form above. `src/components/admin/admin-program-directory.tsx:225-230`
- Fix: Restore old no-results wording/context.

## G2-9-018-057  [P2] GAP  facet F16  effort M
- Legacy: Grid columns xs24 lg10/lg14 with 24 gutter `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:270-292`
- vNext now: Collapsed mobile fullwidth, desktop form md:grid-cols-2, list stacked `src/components/admin/admin-program-directory.tsx:152-182`
- Fix: Use 24/24 on phone and 10/14 on lg; preserve touch sizes.

## G2-9-018-060  [P2] GAP  facet F18  effort S
- Legacy: Program Name header `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:213-216`
- vNext now: Header Program `src/components/admin/admin-program-directory.tsx:44`
- Fix: Match exact header label.

## G2-9-018-061  [P2] GAP  facet F18  effort S
- Legacy: Search programs or departments placeholder `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:292-294`
- vNext now: Search program, code or department placeholder `src/components/admin/admin-program-directory.tsx:194-199`
- Fix: Use legacy placeholder, separate extended-code search behavior.

## G2-9-018-062  [P2] GAP  facet F18  effort M
- Legacy: Legacy create/edit title and error text `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:269-275,324-330`
- vNext now: Create details disclosure/Edit program and generic toast `src/components/admin/admin-program-directory.tsx:140-145` `src/components/academics/academics-actions.tsx:178-180`
- Fix: Align labels and error texts one by one with legacy copy catalogue.

## G2-10-020-003  [P3] GAP  facet F01  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:22-24 — Base path is /superadmin or /college-admin and Department link respects it.
- vNext now: src/components/admin/admin-program-directory.tsx:149-152 — Department link hardcoded /admin/departments.
- Fix: Route department link via role-appropriate legacy-compatible admin prefix.

## G2-10-020-027  [P3] GAP  facet F05  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:292-298 — Search placeholder 'Search programs or departments'.
- vNext now: src/components/admin/admin-program-directory.tsx:195-200 — Label same but placeholder 'Search program, code or department'.
- Fix: Match exact placeholder.

## G2-10-020-028  [P3] GAP  facet F05  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:319 — Empty search 'No matching programs. Clear search to see all.'
- vNext now: src/components/admin/admin-program-directory.tsx:224-230 — 'No matching programs.'
- Fix: Add clear-search guidance in empty state.

## G2-10-020-029  [P3] GAP  facet F06  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:278-281 — Name input placeholder 'e.g., B.Tech Computer Science'.
- vNext now: src/components/admin/admin-program-directory.tsx:168-173 — 'e.g. Computer Science Engineering'.
- Fix: Match comma/field example exactly.

## G2-10-020-032  [P3] GAP  facet F06  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:282-285 — InputNumber suffix Years and hint placeholder 'e.g., 4'.
- vNext now: src/components/admin/admin-program-directory.tsx:179-184 — Native number input no Years suffix/hint.
- Fix: Add suffix and placeholder.

## G2-10-020-033  [P3] GAP  facet F06  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:286-287 — Create Program primary with plus icon.
- vNext now: src/components/admin/admin-program-directory.tsx:186-189 — No plus icon, button text switches Creating….
- Fix: Restore plus icon and source spinner style.

## G2-10-020-072  [P3] GAP  facet F13  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:318-319 — Empty no programs: 'No programs found. Create a department first.'
- vNext now: src/components/admin/admin-program-directory.tsx:224-230 — 'No programs yet. Create the first program using the form above.' when departments exist.
- Fix: Restore exact table empty message.

## G2-10-020-073  [P3] MISSING  facet F13  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:302-306 — Background refresh status `Refreshing programs…`.
- vNext now: src/components/admin/admin-program-directory.tsx:211-214 — router.refresh via View options without refresh indicator.
- Fix: Show refresh progress and fallback status.

## G2-10-020-075  [P3] GAP  facet F14  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:292-298 — Export action toolbar available unconditionally on table.
- vNext now: src/components/admin/admin-program-directory.tsx:201-213 — Export CSV only when View options expanded; disabled if filtered zero.
- Fix: Keep export action visible and predictable.

## G2-10-020-087  [P3] GAP  facet F18  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:214 — Column header 'Program Name'.
- vNext now: src/components/admin/admin-program-directory.tsx:43-45 — Header 'Program'.
- Fix: Use 'Program Name'.

## G2-13-018-045  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:207` exact delete success 'Program deleted successfully'
- vNext now: `src/app/(authenticated)/college/programs/page.tsx:47` Archived Programs separate list; `src/components/admin/admin-program-directory.tsx:128` created toast
- Fix: Use 'Archived program' where actual mutation archives, not false deleted claim

## G2-20-029-006  [P3] GAP  facet F03  effort S
- Legacy: Create button has PlusOutlined icon (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:289-290`)
- vNext now: Create Program plain button (`src/components/admin/admin-program-directory.tsx:175-179`)
- Fix: Restore Plus icon and spacing

## G2-20-029-018  [P3] GAP  facet F05  effort S
- Legacy: Preference key admin-programs-page-size (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:15-16`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:51-55`)
- vNext now: Preference key 42lms-program-page-size (`src/components/admin/admin-program-directory.tsx:24-33`)
- Fix: Migrate/read legacy localStorage key

## G2-20-029-022  [P3] GAP  facet F05  effort S
- Legacy: Search input 220px with debounce 220ms (`docs/legacy-source/frontend/src/components/admin/AdminTableToolbar.js:34-43`, `docs/legacy-source/frontend/src/components/admin/AdminTableToolbar.js:59-69`)
- vNext now: Controlled search filters on every keystroke (`src/components/admin/admin-program-directory.tsx:188-193`)
- Fix: Apply 220ms debounce for legacy filtering behavior

## G2-20-029-023  [P3] GAP  facet F05  effort S
- Legacy: Search empty state 'No matching programs. Clear search to see all.' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:320`)
- vNext now: Empty state 'No matching programs.' and a separate Clear search button (`src/components/admin/admin-program-directory.tsx:218-226`)
- Fix: Use exact legacy empty-state copy

## G2-20-029-025  [P3] GAP  facet F06  effort S
- Legacy: Create Program Name max255, placeholder 'e.g., B.Tech Computer Science' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:279-284`)
- vNext now: max255, placeholder 'e.g. Computer Science Engineering' (`src/components/admin/admin-program-directory.tsx:161-166`)
- Fix: Restore exact placeholder

## G2-20-029-026  [P3] GAP  facet F06  effort S
- Legacy: Duration (Years) InputNumber 1..10, addonAfter 'Years', example placeholder e.g.,4, default 4 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:285-288`)
- vNext now: Native number 1..10 default4, no addon or example (`src/components/admin/admin-program-directory.tsx:98`, `src/components/admin/admin-program-directory.tsx:169-173`)
- Fix: Restore Years addon and placeholder with default4

## G2-20-029-055  [P3] GAP  facet F13  effort S
- Legacy: No programs empty says 'No programs found. Create a department first.' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:320-321`)
- vNext now: Varies based on departments length; 'No programs yet...' (`src/components/admin/admin-program-directory.tsx:218-226`)
- Fix: Restore exact empty-state wording

## G2-20-029-064  [P3] GAP  facet F18  effort S
- Legacy: Legacy placeholder 'Search programs or departments' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:293-294`)
- vNext now: Input label is that but placeholder differs 'Search program, code or department' (`src/components/admin/admin-program-directory.tsx:188-193`)
- Fix: Match placeholder text exactly

## G2-9-018-020  [P3] GAP  facet F05  effort S
- Legacy: Storage key admin-programs-page-size `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:13-15,45-50`
- vNext now: Storage key 42lms-program-page-size `src/components/admin/admin-program-directory.tsx:25-40`
- Fix: Read legacy key for seamless retained page-size preference.
