# Work packet (wave 2): edit src/components/academics/college-structure-directory.tsx

29 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md, docs/audit/gap2/lane-5/u010-classes-shared-component.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-5-003-001  [P2] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: Admin Academic shell, active menu classes. (docs/legacy-source/frontend/src/pages/college-admin/classes.js:14-16; docs/legacy-source/frontend/src/pages/college-admin/classes.js:31-40)
- vNext now: New direct /college/classes page with Academic workspace return link. (src/app/(authenticated)/college/classes/page.tsx:18-35; src/components/academics/college-structure-directory.tsx:38-49)
- Fix: Preserve Academic Setup shell group/active class navigation and consistent back route.

## G2-5-003-004  [P2] GAP  facet F02 Layout/section order  effort M
- Legacy: Header followed by two side-by-side cards: Create New Class/Section left, Existing Classes/Sections right. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:440-465; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:466-512)
- vNext now: Collapsed Create class precedes full-width filters/table, More class tools collapsible. (src/app/(authenticated)/college/classes/page.tsx:35-54; src/components/academics/college-structure-directory.tsx:42-51)
- Fix: Use two-column at lg, 10/14 grid ratio, cards open by default.

## G2-5-003-009  [P2] GAP  facet F03 Visible elements  effort M
- Legacy: Header toolbar has Refresh, Export classes.csv and result counts. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:467-476)
- vNext now: CSV buried in More class tools; no explicit Refresh; matching total paragraph. (src/app/(authenticated)/college/classes/page.tsx:38-51; src/components/academics/college-structure-directory.tsx:364-367)
- Fix: Restore toolbar positions, Refresh and count formatting.

## G2-5-003-013  [P2] GAP  facet F04 Data format  effort S
- Legacy: Legacy upperLimit 0 maps No limit, positive numeric. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:395-397)
- vNext now: Null capacity renders Not configured; numeric value otherwise. (src/modules/academics/college-structure-directory-model.ts:180-182; src/components/academics/college-structure-directory.tsx:393)
- Fix: Map historical zero and null semantics explicitly with expected No limit wording.

## G2-5-003-017  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: Program filter 165px and dependent Batch filter; selection clears batch, immediate filtering. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:485-494)
- vNext now: Program GET selector and batchCode in More filters; no visible dependent batch chooser. (src/components/academics/college-structure-directory.tsx:59-80; src/components/academics/college-structure-directory.tsx:118-125)
- Fix: Rebuild program → batch dependent selector with legacy placeholders.

## G2-5-003-060  [P2] GAP  facet F16 Responsive  effort S
- Legacy: AntD responsive Row left create card xs24/lg10 and right directory xs24/lg14. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:446-467)
- vNext now: Full-width stacked form disclosure and directory. (src/components/academics/college-section-management.tsx:78-88; src/components/academics/college-structure-directory.tsx:42-50)
- Fix: Restore lg two-column 10/14 split; mobile stack.

## G2-5-003-061  [P2] GAP  facet F16 Responsive  effort M
- Legacy: Program/Batch 165px filters, horizontally wrapping Space; table scroll x max-content. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:489-500)
- vNext now: Grid-based search and filters, DataTable responsive card priorities. (src/components/academics/college-structure-directory.tsx:59-80; src/components/academics/college-structure-directory.tsx:380-408)
- Fix: Maintain compact filter widths and overflow table on tablet.

## G2-5-003-069  [P2] GAP  facet F19 Performance  effort S
- Legacy: Page size stored in localStorage and used on repeat visits. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:160-163; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:501-505)
- vNext now: URL pageSize default10, UI says 25, preference not stored. (src/modules/academics/college-structure-directory-model.ts:3-18; src/components/academics/college-structure-directory.tsx:448-459)
- Fix: Persist 10/25/50/100 preference and fix UI/current server mismatch.

## G2-5-010-004  [P2] GAP  facet F02 Layout/section order  effort L
- Legacy: Create form card left 10/24 columns; directory right14/24 (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:440-465)
- vNext now: Collapsed create and full-width directory vertical sections (src/components/academics/college-section-management.tsx:78-143; src/components/academics/college-structure-directory.tsx:42-51)
- Fix: Use 10/14 desktop column split and mobile stacking.

## G2-5-010-005  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: Class header title/subtitle, separate cards Create New Class/Section and Existing Classes/Sections (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:442-448)
- vNext now: Classes title, Create class disclosure and filters heading (src/app/(authenticated)/college/classes/page.tsx:35-54; src/components/academics/college-structure-directory.tsx:38-51)
- Fix: Restore exact header and card titles.

## G2-5-010-006  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: Header Refresh, Export, result count, filters directly before table (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:467-512)
- vNext now: Search/filter form above, CSV hidden More class tools (src/components/academics/college-structure-directory.tsx:42-80; src/components/academics/college-structure-directory.tsx:364-408)
- Fix: Place toolbar immediately on directory card.

## G2-5-010-022  [P2] GAP  facet F05 Tables/lists  effort S
- Legacy: Search/filter instant without submit (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:219-228)
- vNext now: Requires Filter button (src/components/academics/college-structure-directory.tsx:51-57; src/components/academics/college-structure-directory.tsx:59-80)
- Fix: Auto-apply selection with page reset.

## G2-5-010-061  [P2] GAP  facet F16 Responsive  effort M
- Legacy: AntD xs24 lg10 create and lg14 list (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:446-467)
- vNext now: Full-width stacked create/list (src/app/(authenticated)/college/classes/page.tsx:35-54; src/components/academics/college-structure-directory.tsx:42-51)
- Fix: Use original two-column breakpoints.

## G2-5-010-062  [P2] GAP  facet F16 Responsive  effort M
- Legacy: 165px Select filters horizontal flex wrap, table overflow (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:489-500)
- vNext now: Full-width grid filters and DataTable mobile-priority cards (src/components/academics/college-structure-directory.tsx:59-80; src/components/academics/college-structure-directory.tsx:380-408)
- Fix: Match compact wrap and horizontal table.

## G2-5-010-065  [P2] GAP  facet F18 Wording  effort S
- Legacy: Classes & Sections/Create New Class/Section/Existing Classes/Sections (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:442-448)
- vNext now: Classes/Create class/Filters (src/app/(authenticated)/college/classes/page.tsx:35-54; src/components/academics/college-structure-directory.tsx:42-51)
- Fix: Use exact headings.

## G2-9-007-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/electives.js:33-40` — Academic AdminGroupShell with groupKey academic
- vNext now: `src/components/academics/college-structure-directory.tsx:38-49` — PageHeader with Academic workspace link, no legacy group strip
- Fix: Use legacy academic tab group and active state

## G2-9-007-006  [P2] GAP  facet F02  effort L
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:193-210` — Slot drawer has badges and Offerings then Eligible students tabs
- vNext now: `src/components/academics/college-structure-directory.tsx:428-438` — Independent inline manage offerings and child routes instead of two-tab drawer
- Fix: Restore grouped detail panel and tab sequence

## G2-9-007-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:202-213` — Search slots, Refresh, Program, Semester, archival filter, plus-icon New slot
- vNext now: `src/components/academics/college-structure-directory.tsx:51-80` — Search registered records, Filter submit, Status select, More filters
- Fix: Copy toolbar label/button/icon composition exactly

## G2-9-007-009  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:161-164` — Slot name is clickable with bold name and muted description beneath
- vNext now: `src/components/academics/college-structure-directory.tsx:413-415` — Plain bold text only, not a link, and description missing
- Fix: Render clickable name and 12px description

## G2-9-007-010  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:172-176` — Open/Edit/Archive actions with archive-state and lookup-busy disabled rules
- vNext now: `src/components/academics/college-structure-directory.tsx:428-442` — Open/Edit slot/Manage offerings/Eligible students/Archive-or-Restore
- Fix: Restore labels/order and disabled rules

## G2-9-007-011  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:194-196` — Header pills Program, Sem N, Year N, Status: Active
- vNext now: `src/components/academics/college-structure-directory.tsx:416-427` — Program/semester and year/period displayed as combined columns
- Fix: Create detail header badges in legacy order

## G2-9-007-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:161-177` — Separate Slot, Program, Sem, Year, Credits, Pick, Offerings, Students, Status, action columns
- vNext now: `src/components/academics/college-structure-directory.tsx:410-443` — Combines Program/Sem, Year/period, Credits/Pick into eight columns
- Fix: Split and reorder exact ten column layout

## G2-9-007-014  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:165-168` — Missing Program displayed Program #id and missing Year em dash
- vNext now: `src/components/academics/college-structure-directory.tsx:416-420` — Program joined; Year not recorded and No academic period linked
- Fix: Use legacy missing-value display for matching fields

## G2-9-007-015  [P2] MISSING  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:161-164` — Description under title
- vNext now: `src/components/academics/college-structure-directory.tsx:414-415` — Description not visible despite data being selected
- Fix: Add secondary description line

## G2-9-007-016  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:169-173` — Student null count defaults zero and Pick min–max formatting
- vNext now: `src/components/academics/college-structure-directory.tsx:422-425` — Combined Credits / choices; students tooltip distinct active members
- Fix: Restore standalone Pick text and zero fallback

## G2-9-007-019  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:213-218` — 20-row fixed page size local filter of fully fetched list
- vNext now: `src/components/academics/college-structure-directory.tsx:448-459` — Server page controls say 25/page while schema defaults 10
- Fix: Correct page-size mismatch and document chosen server paging

## G2-9-007-020  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:205-210` — Active only / Incl. archived two-state control
- vNext now: `src/components/academics/college-structure-directory.tsx:72-79` — Status select Active/Archived/All
- Fix: Preserve archive-inclusion labels and semantics

## G2-9-007-055  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:209-218` — Lookup errors show unavailable datasets and Reload; slot failures Retry slots; example empty state
- vNext now: `src/components/academics/college-structure-directory.tsx:368-377` — No electives match these filters and Clear filters; no lookup banner
- Fix: Restore distinct setup/load failures and first-run copy

## G2-9-007-065  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:202-207` — Exact Search slots, New slot, Program, Semester labels
- vNext now: `src/components/academics/college-structure-directory.tsx:51-79` — Search registered records, Filter and Status, New elective slot
- Fix: Copy exact labels and placeholders
