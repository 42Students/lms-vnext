# Work packet (wave 2): edit src/components/admin/admin-program-directory.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-13/new-program.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-9/college-admin-programs.md

## G2-10-020-007  [P2] GAP  facet F02  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:292-321 — Existing Programs Card with toolbar embedded in Card extra.
- vNext now: src/components/admin/admin-program-directory.tsx:193-221 — Table is borderless section, controls below header and View options disclosure.
- Fix: Restore card border/title/header-right toolbar.

## G2-10-020-009  [P2] GAP  facet F03  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:213-247 — Columns Program Name, Duration, Department, Contents, Actions.
- vNext now: src/components/admin/admin-program-directory.tsx:42-79 — Program, Department, Duration, Contents, action-only column.
- Fix: Restore column labels/order/widths (Duration 110, Contents 250, Actions 165).

## G2-10-020-011  [P2] GAP  facet F03  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:220-225 — Dependency counts appear as 3 blue/default Tag chips with singular/plural and tooltip.
- vNext now: src/components/admin/admin-program-directory.tsx:55-64 — One collapsed 'Linked records' Disclosure with text counts.
- Fix: Restore always-visible 3 dependency chips and tooltip.

## G2-10-020-013  [P2] GAP  facet F03  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:249-256 — Missing departments show Ant info Alert and Go to Departments link inside create card.
- vNext now: src/components/admin/admin-program-directory.tsx:149-153 — Plain status paragraph.
- Fix: Restore info banner visual and exact title/description.

## G2-10-020-016  [P2] GAP  facet F04  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:15-18,50-55 — Page size key admin-programs-page-size, permitted 10/25/50/100, initial 25.
- vNext now: src/components/admin/admin-program-directory.tsx:25-35,96-98 — Key 42lms-program-page-size, initial 10.
- Fix: Restore 25-row initial size and migration/alias of preference.

## G2-10-020-019  [P2] GAP  facet F04  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:119-123 — Create sends dept_id/name/duration_years only.
- vNext now: src/components/admin/admin-program-directory.tsx:104-125; src/modules/admin-ui/super-admin-program-input.ts:6-10 — New code auto-derived from program name and durationYears translated to terms.
- Fix: Keep code opt-in or transparent; verify generated code uniqueness on collisions.

## G2-10-020-020  [P2] GAP  facet F04  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:220-225 — Unavailable counts show independent 'semesters: unavailable' Tags.
- vNext now: src/components/admin/admin-program-directory.tsx:55-64 — Missing contents turns into em dash.
- Fix: Show independent unavailable state by semesters/batches/classes.

## G2-10-020-024  [P2] GAP  facet F05  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:310-319 — Ant pagination footer 1–N of total and showSizeChanger always visible.
- vNext now: src/components/admin/admin-program-directory.tsx:201-214,231-241 — Rows per page under View options; custom Previous/Next.
- Fix: Place size selector on table footer and use source pagination UI.

## G2-10-020-025  [P2] GAP  facet F05  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:312-318 — Table page default 25 and on size change jumps page1.
- vNext now: src/components/admin/admin-program-directory.tsx:97-100,201-205 — Default10, size change page1.
- Fix: Change default to25 and keep on size change reset.

## G2-10-020-026  [P2] GAP  facet F05  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:292-298 — Table refresh always visible in toolbar.
- vNext now: src/components/admin/admin-program-directory.tsx:201-214 — Refresh hidden in closed View options disclosure.
- Fix: Keep Refresh visible beside search.

## G2-10-020-030  [P2] GAP  facet F06  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:257-265 — Department Ant Select supports typing/search/filter; status disabled while loading or retry-required.
- vNext now: src/components/admin/admin-program-directory.tsx:154-166 — Native Select no internal search/loading state.
- Fix: Add searchable loading-aware picker and retry.

## G2-10-020-055  [P2] GAP  facet F10  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:112-131; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:43-62 — POST /api/v1/program/create with dept_id, name, duration_years.
- vNext now: src/components/admin/admin-program-directory.tsx:104-125; src/app/api/academics/programs/route.ts:28-44 — POST /api/academics/programs with code and durationTerms.
- Fix: Preserve form mapping and feedback, enforce same college.

## G2-10-020-071  [P2] GAP  facet F13  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:250-265 — Departments loading/unavailable distinct from no departments.
- vNext now: src/components/admin/admin-program-directory.tsx:149-165 — Only empty departments check; page-wide fetch failure.
- Fix: Expose retryable department-specific state.

## G2-10-020-074  [P2] GAP  facet F14  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:292-298 — programs.csv emitted for filtered rows, with id/deptId and years.
- vNext now: src/modules/admin-ui/program-directory.ts:62-70 — CSV with code/department and terms, BOM added by src/components/admin/admin-program-directory.tsx:101-102.
- Fix: Match CSV header/data order and duration units.

## G2-10-020-080  [P2] GAP  facet F16  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:270-291 — lg 10/24 create +14/24 list; xs stack.
- vNext now: src/components/admin/admin-program-directory.tsx:139-193 — Vertical details+list at all widths.
- Fix: Recreate lg split with 24 gutter.

## G2-10-020-081  [P2] GAP  facet F16  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:310-319 — Table scroll x:max-content for mobile.
- vNext now: src/components/admin/admin-program-directory.tsx:222-230 — DataTable mobile column-priority layout, no explicit horizontal scroll.
- Fix: Keep desktop columns via horizontal scroll at legacy breakpoint.

## G2-10-020-084  [P2] GAP  facet F17  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:277-284 — Ant Form.Item ties field validation to input.
- vNext now: src/components/admin/admin-program-directory.tsx:154-184 — Labels associated but validation shown global toast.
- Fix: Link inline error via aria-describedby and aria-invalid.

## G2-10-020-090  [P2] GAP  facet F18  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:274-275 — 'Program was not created' alert.
- vNext now: src/components/admin/admin-program-directory.tsx:130-135 — 'Program creation failed' toast.
- Fix: Restore exact failure heading.

## G2-10-020-101  [P2] GAP  facet F21  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:163-168 — Contents dependencies from SemesterService, getBatchesByProgram, getClassCountByProgram.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:42-43; src/components/admin/admin-program-directory.tsx:55-64 — Server aggregated contents, displayed collapsed.
- Fix: Compare archived/active counting and chip states across service.

## G2-10-020-110  [P2] GAP  facet F23  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:163-168 — Dependency count chip semantics from live three APIs.
- vNext now: src/components/admin/admin-program-directory.tsx:55-64 — Aggregated counts moved into disclosure.
- Fix: Restore chips, preserve safer server batching.

## G2-13-018-013  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:227-245` paged college endpoint default page0 size20 max100
- vNext now: `src/components/admin/admin-program-directory.tsx:25-40` client localStorage page size default10 options10/25/50/100
- Fix: Separate old API default20/page0 from new UI default10/page1 and migrate deep link/page controls

## G2-13-018-028  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:23-31` paged native query with explicit countQuery
- vNext now: `src/modules/academics/program-service.ts:182-205` loads all programs in one DB query, `src/components/admin/admin-program-directory.tsx:99-100` client paginates
- Fix: Add server-side pagination if many programs; preserve caller total counts

## G2-13-018-044  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:69-71` exact conflict message 'Program name already exists in this department'
- vNext now: `src/modules/academics/college-program-mutation-service.ts:119-123` PROGRAM_NAME_CONFLICT; `src/components/admin/admin-program-directory.tsx:131-134` generic create error toast
- Fix: Translate duplicate conflict to clear legacy sentence rather than opaque code

## G2-13-018-047  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:227-245` optional paged lookup default20, capped100
- vNext now: `src/modules/academics/program-service.ts:182-205` unpaged but department/name SQL indexed via `src/db/schema/academics.ts:56-70`; `src/components/admin/admin-program-directory.tsx:99` paginates client
- Fix: Use paginated API for institution-scale program listings; don't materialize all org records

## G2-20-029-003  [P2] GAP  facet F02  effort M
- Legacy: Two side-by-side lg columns: 10/24 Create New Program card, 14/24 Existing Programs card (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:267-292`)
- vNext now: Single-column disclosure followed by results section (`src/components/admin/admin-program-directory.tsx:147-155`, `src/components/admin/admin-program-directory.tsx:182-188`)
- Fix: Reproduce lg two-column proportions and visible two-card order

## G2-20-029-005  [P2] GAP  facet F02  effort M
- Legacy: Existing Programs card header embeds compact toolbar (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:292-300`)
- vNext now: Search outside View options disclosure; controls otherwise hidden (`src/components/admin/admin-program-directory.tsx:182-211`)
- Fix: Place toolbar in results header and show Export/Refresh without disclosure

## G2-20-029-007  [P2] GAP  facet F03  effort M
- Legacy: Row Edit and Delete buttons are individually visible with corresponding icons and aria-labels (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:232-242`)
- vNext now: Actions dropdown contains Edit and Archive (`src/components/admin/admin-program-directory.tsx:67-78`, `src/components/academics/academics-actions.tsx:159-167`)
- Fix: Expose Edit and Delete controls inline with legacy icons/labels

## G2-20-029-008  [P2] GAP  facet F03  effort M
- Legacy: Contents presents 3 colored singular/plural Tag chips and hover tooltip (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:220-227`)
- vNext now: Disclosure 'Linked records' shows single semicolon-separated text (`src/components/admin/admin-program-directory.tsx:55-64`)
- Fix: Show 3 chips with singularization, unknown state, and tooltip

## G2-20-029-009  [P2] GAP  facet F03  effort S
- Legacy: Department availability notice includes icon and contextual Go to Departments link (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:249-256`)
- vNext now: Inline status paragraph; link points /admin/departments for both roles (`src/components/admin/admin-program-directory.tsx:151-157`)
- Fix: Restore warning/info Alert and role-specific department destination

## G2-20-029-010  [P2] GAP  facet F04  effort S
- Legacy: Table columns in order Program Name, Duration, Department, Contents, Actions (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:213-246`)
- vNext now: Columns Program, Department, Duration, Contents, Actions (`src/components/admin/admin-program-directory.tsx:42-78`)
- Fix: Swap Department/Duration to legacy order and rename Program Name

## G2-20-029-012  [P2] GAP  facet F04  effort S
- Legacy: Department resolves dept_name/deptName, then current selector name; fallback 'Name unavailable' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:218-219`)
- vNext now: Uses departmentName directly with no fallback (`src/components/admin/admin-program-directory.tsx:52-53`)
- Fix: Add legacy fallback resolution and placeholder

## G2-20-029-013  [P2] GAP  facet F04  effort M
- Legacy: Contents unavailable state shows 'Checking dependencies…' then 'semesters: unavailable' per chip (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:220-225`)
- vNext now: Missing contents shows lone em dash (`src/components/admin/admin-program-directory.tsx:55-64`)
- Fix: Keep loading versus failed dependency lookup distinct

## G2-20-029-017  [P2] GAP  facet F05  effort S
- Legacy: Default 25 rows per page (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:47-48`)
- vNext now: Default 10 via localStorage fallback (`src/components/admin/admin-program-directory.tsx:24-33`)
- Fix: Set default 25 and use legacy saved preference key

## G2-20-029-020  [P2] GAP  facet F05  effort M
- Legacy: AntD Table pager shows 'start-end of total' and integrated page-size selector (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:311-319`)
- vNext now: Separate Previous/Next + Page n of n, page-size in disclosure (`src/components/admin/admin-program-directory.tsx:226-242`)
- Fix: Restore AntD-style range/pager and integrated size changer

## G2-20-029-021  [P2] GAP  facet F05  effort S
- Legacy: No row bulk action or row click; each row has Edit/Delete (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:228-245`)
- vNext now: No bulk action or row click; row action is dropdown (`src/components/admin/admin-program-directory.tsx:65-78`)
- Fix: Retain action visibility without adding bulk/row navigation

## G2-20-029-024  [P2] GAP  facet F06  effort M
- Legacy: Department searchable AntD select with dynamic loading/unavailable placeholder (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:257-265`)
- vNext now: Native Select options; no field-level loading state (`src/components/admin/admin-program-directory.tsx:155-160`)
- Fix: Restore searchable picker and scoped fetch/loading/errors

## G2-20-029-044  [P2] GAP  facet F10  effort M
- Legacy: Create POST new-program/create JSON name,dept_id,duration_years (`docs/legacy-source/frontend/src/api/Services/AdminService.js:117-126`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:59-83`)
- vNext now: POST /api/academics/programs JSON departmentId,name,code,durationTerms, returns 201 (`src/components/admin/admin-program-directory.tsx:107-123`, `src/app/api/academics/programs/route.ts:28-36`)
- Fix: Adapter translates dept_id/duration_years and status handling

## G2-20-029-059  [P2] GAP  facet F16  effort M
- Legacy: Columns xs24/lg10 and xs24/lg14; table horizontal scroll max-content (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:268-270`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:310-314`)
- vNext now: md grid form, mobile prioritized DataTable and responsive min-height controls (`src/components/admin/admin-program-directory.tsx:157-179`, `src/components/admin/admin-program-directory.tsx:42-77`)
- Fix: Match old lg split and horizontal overflow, verify phone/tablet screenshot

## G2-9-018-005  [P2] GAP  facet F02  effort S
- Legacy: Create New Program card always visible `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:270-289`
- vNext now: Create form collapsed behind details when programs exist `src/components/admin/admin-program-directory.tsx:139-145`
- Fix: Keep creation panel visible, not closed by default.

## G2-9-018-006  [P2] GAP  facet F02  effort M
- Legacy: Existing Programs card includes toolbar in card extra `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:291-302`
- vNext now: Unboxed list section and separate View options disclosure `src/components/admin/admin-program-directory.tsx:187-208`
- Fix: Place toolbar/actions in list card header in legacy order.
