# Work packet (wave 2): edit src/components/academics/college-academic-directory.tsx

37 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-batches.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-9-003-004  [P2] GAP  facet F02  effort M
- Legacy: Header, desktop 10-column Create New Batch and 14-column Existing Batches cards (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:512-539`)
- vNext now: Header then create disclosure and filter/results stacked (`src/components/academics/college-academic-directory.tsx:32-51`)
- Fix: Use legacy two-column desktop split, matching card widths and gutters.

## G2-9-003-005  [P2] GAP  facet F02  effort M
- Legacy: Subtitle Manage cohorts, their academic year and current semester... (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:513-519`)
- vNext now: No subtitle, adds Academic workspace link (`src/components/academics/college-academic-directory.tsx:30-51`)
- Fix: Restore exact subtitle and header height.

## G2-9-003-006  [P2] GAP  facet F02  effort M
- Legacy: Existing Batches card includes compact table controls (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-584`)
- vNext now: FilterBar, disclosure of More filters, then full-width DataTable (`src/components/academics/college-academic-directory.tsx:50-78`)
- Fix: Place compact toolbar/filter/table within card.

## G2-9-003-008  [P2] GAP  facet F03  effort M
- Legacy: Existing Batches card heading (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-548`)
- vNext now: Batch results region without named card (`src/components/academics/college-academic-directory.tsx:241-290`)
- Fix: Restore Existing Batches heading and border.

## G2-9-003-009  [P2] GAP  facet F03  effort M
- Legacy: Search toolbar, refresh, result count, export plus program/status dropdowns (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:556-568`)
- vNext now: New form filters, advanced disclosure, no Refresh icon (`src/components/academics/college-academic-directory.tsx:53-239`)
- Fix: Restore compact toolbar and refresh status indicator.

## G2-9-003-011  [P2] GAP  facet F03  effort M
- Legacy: Active green, Inactive orange, Completed gray status (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:32-40`)
- vNext now: New StatusBadge lifecycle values (`src/components/academics/college-academic-directory.tsx:292-324`)
- Fix: Preserve legacy status colors and captions, map ARCHIVED separately.

## G2-9-003-012  [P2] GAP  facet F04  effort M
- Legacy: Nine columns Batch Name, Program, Years, Current Semester, Academic Year, Classes, Students, Status, Actions (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:465-481`)
- vNext now: Batch, Program, Years, Academic Year, Current Semester, Active classes/learners, Status, Actions (`src/components/academics/college-academic-directory.tsx:283-331`)
- Fix: Restore exact title/order and separate Classes and Students columns.

## G2-9-003-013  [P2] GAP  facet F04  effort M
- Legacy: Years single 'startYear – endYear' or em dash (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:468-472`)
- vNext now: Start Date, End Date, start period stacked (`src/components/academics/college-academic-directory.tsx:304-311`)
- Fix: Render legacy year range as primary cell.

## G2-9-003-014  [P2] GAP  facet F04  effort M
- Legacy: Current Semester blue pill 'Semester N' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:473-475`)
- vNext now: batchProgressLabel says Term N with academic year (`src/components/academics/college-academic-directory.tsx:315-320`)
- Fix: Use blue Semester N pill; keep expanded detail optional.

## G2-9-003-015  [P2] GAP  facet F04  effort M
- Legacy: Academic Year YYYY-YY or em dash (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:475-477`)
- vNext now: Persisted year or 'Not recorded' (`src/components/academics/college-academic-directory.tsx:311-318`)
- Fix: Retain legacy missing glyph em dash.

## G2-9-003-016  [P2] GAP  facet F04  effort M
- Legacy: Separate Classes and Students numeric columns (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:476-478`)
- vNext now: Combined Active classes / learners text (`src/components/academics/college-academic-directory.tsx:320-326`)
- Fix: Split class and learner counts and use same legacy count semantics.

## G2-9-003-017  [P2] GAP  facet F04  effort M
- Legacy: Program name unavailable fallback (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:466-468`)
- vNext now: Program name and code combined (`src/components/academics/college-academic-directory.tsx:303-305`)
- Fix: Use human program name or 'Program name unavailable' for unresolved value.

## G2-9-003-019  [P2] GAP  facet F05  effort M
- Legacy: Table small, scroll x:max-content (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:572-580`)
- vNext now: Region with DataTable mobile priority (`src/components/academics/college-academic-directory.tsx:241-293`)
- Fix: Keep dense table and intentional horizontal scroll.

## G2-9-003-021  [P2] GAP  facet F05  effort M
- Legacy: Pagination shows X-Y of total (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:573-579`)
- vNext now: Server total and paginated next links (`src/components/academics/college-academic-directory.tsx:332-349`)
- Fix: Match range count wording and page size selector.

## G2-9-003-023  [P2] GAP  facet F06  effort M
- Legacy: Program filter all programs, Status Active/Inactive/Completed (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:556-565`)
- vNext now: Program with code, Status Planned/Active/Completed/Archived (`src/components/academics/college-academic-directory.tsx:69-95`)
- Fix: Show Inactive legacy label and map to current lifecycle; keep extra statuses.

## G2-9-003-061  [P2] GAP  facet F13  effort M
- Legacy: No batches yet. Create a program first or No batches match search/filters (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:579-582`)
- vNext now: No cohorts match filters; progression not inferred (`src/components/academics/college-academic-directory.tsx:244-252`)
- Fix: Restore distinct initial-empty vs filtered-empty text.

## G2-9-003-069  [P2] GAP  facet F16  effort M
- Legacy: Desktop lg 10/14 grid, mobile stacked (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:518-538`)
- vNext now: Single-column create and results stacked (`src/components/academics/college-academic-directory.tsx:31-51`)
- Fix: Restore 10/14 split at >=1200 without breaking responsive table.

## G2-9-003-070  [P2] GAP  facet F16  effort M
- Legacy: Horizontal table scrolling on mobile (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:572-580`)
- vNext now: DataTable mobile priorities collapse cells (`src/components/academics/college-academic-directory.tsx:241-294`)
- Fix: Preserve visible actions/data discoverability and scroll at 375/768.

## G2-9-003-076  [P2] GAP  facet F18  effort M
- Legacy: Search batch, year, program or status placeholder (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-542`)
- vNext now: Search name or code placeholder (`src/components/academics/college-academic-directory.tsx:53-60`)
- Fix: Restore legacy search placeholder and matching scope.

## G2-9-003-077  [P2] GAP  facet F18  effort M
- Legacy: Column labels Batch Name, Years, Current Semester, Classes, Students (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:465-479`)
- vNext now: Batch, Years, Current Semester, Active classes / learners (`src/components/academics/college-academic-directory.tsx:295-330`)
- Fix: Restore exact header words and order.

## G2-9-003-081  [P2] MISSING  facet F19  effort M
- Legacy: Roster pagination 20 rows no size changer (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:293-300`)
- vNext now: Roster list absent (`src/components/academics/college-academic-directory.tsx:284-331`)
- Fix: Restore roster 20-row paging.

## G2-9-019-002  [P2] GAP  facet F01  effort M
- Legacy: AdminGroupShell academic parent tabs `docs/legacy-source/frontend/src/pages/college-admin/semesters.js:31-36`
- vNext now: Only Academic workspace back-link in PageHeader `src/components/academics/college-academic-directory.tsx:34-45`
- Fix: Restore old academic group tab strip and active selection.

## G2-9-019-004  [P2] GAP  facet F02  effort M
- Legacy: Semesters title, Row gutter24 with Create New Semester left lg10 and Semesters list right lg14 `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:396-412,457-463`
- vNext now: PageHeader, collapsed create details, FilterBar, unboxed table all stacked `src/components/academics/college-academic-directory.tsx:29-68,239-280`
- Fix: Recreate two-column layout with framed cards.

## G2-9-019-006  [P2] GAP  facet F02  effort M
- Legacy: List toolbar embedded in right Card extra `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:460-508`
- vNext now: Filters stand-alone across page with More filters disclosure `src/components/academics/college-academic-directory.tsx:50-110`
- Fix: Align list toolbar in card header.

## G2-9-019-009  [P2] GAP  facet F03  effort M
- Legacy: Semester number is blue Tag Sem N `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:333-339`
- vNext now: Semester N secondary text under name `src/components/academics/college-academic-directory.tsx:260-266`
- Fix: Render pill Sem N column, not subtitle.

## G2-9-019-010  [P2] GAP  facet F03  effort S
- Legacy: Active / Inactive with green/red Ant Tag `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:356-364`
- vNext now: Plain text status `src/components/academics/college-academic-directory.tsx:268-271`
- Fix: Use legacy colored status tags.

## G2-9-019-012  [P2] GAP  facet F04  effort M
- Legacy: Columns Program, Semester #, Name, Credits, Courses, Status, Actions `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:326-394`
- vNext now: Columns Semester, Program, Credits, Mapped courses, Status, Actions `src/components/academics/college-academic-directory.tsx:257-275`
- Fix: Reorder 7 columns and restore distinct Semester #/Name.

## G2-9-019-014  [P2] GAP  facet F04  effort S
- Legacy: Credits shown — when no mapped courses `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:341-348`
- vNext now: Mapped credits null coerced to 0 `src/components/academics/college-academic-directory.tsx:267-267`
- Fix: Use em dash for unmapped, zero only if mapped sum is zero.

## G2-9-019-017  [P2] GAP  facet F05  effort S
- Legacy: Select Filter by program 200px, clearable `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:461-477`
- vNext now: Fullwidth Program dropdown with All programs option `src/components/academics/college-academic-directory.tsx:70-81`
- Fix: Align 200px selector with toolbar.

## G2-9-019-021  [P2] GAP  facet F05  effort M
- Legacy: Table size small scroll max-content `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:529-539`
- vNext now: Semantic responsive DataTable with mobilePriorities `src/components/academics/college-academic-directory.tsx:257-277`
- Fix: Match compact row density and horizontal overflow.

## G2-9-019-022  [P2] GAP  facet F05  effort S
- Legacy: Legacy no-result wording: No semesters found. Create a program first, then add semesters. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:543`
- vNext now: No semesters match these filters. `src/components/academics/college-academic-directory.tsx:244-256`
- Fix: Use default legacy text, keep filtered-specific recovery.

## G2-9-019-055  [P2] GAP  facet F13  effort S
- Legacy: Empty content asks create a program first `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:543`
- vNext now: No semesters match these filters plus clear filters `src/components/academics/college-academic-directory.tsx:244-256`
- Fix: Separate default empty from filtered empty with exact old guidance.

## G2-9-019-059  [P2] GAP  facet F16  effort M
- Legacy: xs24 lg10+14 two cards, nested xs24 sm12 for semester # `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:408-438`
- vNext now: Stacked details, md:grid-cols-2, FilterBar four cols 992px `src/components/academics/college-semester-management.tsx:76-103` `src/components/academics/college-academic-directory.tsx:64-69`
- Fix: Rebuild mobile stack/desktop proportions and half width input.

## G2-9-019-062  [P2] GAP  facet F18  effort S
- Legacy: Table columns Semester #, Name, Courses `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:333-356`
- vNext now: Table column labels Semester, Mapped courses `src/components/academics/college-academic-directory.tsx:257-275`
- Fix: Restore exact legacy column labels/order.

## G2-9-019-063  [P2] GAP  facet F18  effort S
- Legacy: Search semesters input placeholder `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:482-485`
- vNext now: Placeholder Search name or code `src/components/academics/college-academic-directory.tsx:53-59`
- Fix: Use exact legacy search placeholder.

## G2-9-019-066  [P2] GAP  facet F19  effort M
- Legacy: Legacy table pagination client pageSize10 `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:529-543`
- vNext now: Server paginates page/pageSize, default10, label hardcodes25 `src/modules/academics/college-academic-directory-model.ts:13-18` `src/modules/academics/college-academic-directory-service.ts:99-105` `src/components/academics/college-academic-directory.tsx:317-320`
- Fix: Fix default-label mismatch and add user page-size choice.

## G2-9-003-024  [P3] GAP  facet F06  effort M
- Legacy: Clear filters only when program/status selected (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:557-566`)
- vNext now: Clear always shown in FilterBar (`src/components/academics/college-academic-directory.tsx:227-239`)
- Fix: Hide or disable Clear when no filters active.
