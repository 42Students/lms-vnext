# Work packet (wave 2): edit src/app/(authenticated)/admin/features/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l14-u024-superadmin-feature-controller.md, docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-14-024-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:31-33,75-76 — GET /api/v1/superadmin/features
- vNext now: src/app/(authenticated)/admin/features/page.tsx:23-27,66-80 — render server page /admin/features with read service
- Fix: Document new route+API contract for catalog access.

## G2-14-024-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:75-144 — JSON effective settings for entire in-scope college list
- vNext now: src/app/(authenticated)/admin/features/page.tsx:105-265 — paginated matrix with per-college inline disclosure editors
- Fix: Document pagination/scope changes for old consumers.

## G2-14-024-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:121-140 — modules details effective level, scope id, locked, editableHere
- vNext now: src/app/(authenticated)/admin/features/page.tsx:245-253 — matrix ModuleState+editor nested in cell
- Fix: Surface exact effectiveLevel/effectiveScope metadata for reviewers.

## G2-14-024-011  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:136-140 — list one college each row, project/placement effective booleans
- vNext now: src/app/(authenticated)/admin/features/page.tsx:229-257 — matrix displays name/code and Enabled statuses+disclosures
- Fix: Match old toggle/list column priority and action visibility.

## G2-10-007-004  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/AdminControlOverview.jsx:15-30` overview Card eyebrow/tag/title/description/Refresh
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:127-135` border-top panel omits colored tag and Refresh
- Fix: Reinstate overview header and Refresh at upper right

## G2-10-007-005  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:303-333` overview followed by mutation alert and search Card
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:127-208` overview then dedicated filter section, errors inside editors
- Fix: Restore top-level mutation feedback and legacy section order

## G2-10-007-006  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:333-366` Ant small Card encloses search and Table
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:136-311` separated form and bare DataTable
- Fix: Match legacy white panel, hairline border and internal spacing

## G2-10-007-008  [P2] MISSING  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:314` ReloadOutlined Refresh small with loading
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:122-135` no refresh button
- Fix: Add Refresh with read revalidation and disabled-loading state

## G2-10-007-009  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:307-308` colored One college / Organization scope / Platform view Tag
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:105-128` plain text scope label
- Fix: Restore legacy color-coded scope chip

## G2-10-007-011  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:335-341` aria-label Search feature-control colleges and placeholder Search colleges
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:142-152` Find college / College name or code
- Fix: Restore legacy accessible placeholder/label

## G2-10-007-012  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:343-348` conditional N of M and Clear
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:199-225` always Clear plus range/total caption
- Fix: Show inline filtered count and conditionally Clear

## G2-10-007-013  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:278-286` immediate Locked at / Inherited from captions
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:40-60` Enabled/Disabled badges and hidden Rule source
- Fix: Display lock and inheritance captions without disclosure

## G2-10-007-015  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:305-306` says Courses & Content core, never turned off
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:122-125` three optional modules text lacks explicit core-course caveat
- Fix: Put exact core-module note in overview description

## G2-10-007-017  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:251-256` fixed-left College and width=140 module cells
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:233-263` columns have no fixed width specified
- Fix: Match College pinned position and each 140px module column

## G2-10-007-023  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:340-347` live client search and allowClear
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:137-205` GET submit Search, full reset Clear
- Fix: Restore live filtering or mark approved server-search change

## G2-10-007-025  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:363-364` pageSize20, size changer, X–Y of N
- vNext now: `src/modules/module-access/admin-read-service.ts:47`,209-210 fixed 20 and `src/app/(authenticated)/admin/features/page.tsx:265-310` prev/next only
- Fix: Add page-size chooser and legacy range wording

## G2-10-007-061  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:350-365` differentiates no colleges/no search hits/load failure
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:229-232` generic No colleges on this page
- Fix: Restore three distinct empty states

## G2-10-007-068  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/styles/pages/_admin-list-pages.scss:1626-1634` at max767 metrics 2 columns, at max420 1
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:130-134` uses two columns even at 375
- Fix: Use legacy 420px 1-col breakpoint for metrics

## G2-10-007-070  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/styles/pages/_admin-list-pages.scss:1626-1630` action becomes full-width on phones
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:127-135` no Refresh action
- Fix: Make restored Refresh full-width on phones

## G2-10-007-075  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:305-306` broad availability copy names Projects, Placements, Courses & Content
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:122-125` replaces with three optional modules text
- Fix: Restore legacy explanatory wording or approve updated Electives copy

## G2-10-007-076  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:335-341` placeholder Search colleges
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:149-150` placeholder College name or code
- Fix: Use legacy placeholder

## G2-9-036-004  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/AdminControlOverview.jsx:15-30` overview Card eyebrow/tag/title/description/Refresh
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:127-135` border-top panel omits colored tag and Refresh
- Fix: Reinstate overview header and Refresh at upper right

## G2-9-036-005  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:303-333` overview followed by mutation alert and search Card
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:127-208` overview then dedicated filter section, errors inside editors
- Fix: Restore top-level mutation feedback and legacy section order

## G2-9-036-006  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:333-366` Ant small Card encloses search and Table
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:136-311` separated form and bare DataTable
- Fix: Match legacy white panel, hairline border and internal spacing

## G2-9-036-008  [P2] MISSING  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:314` ReloadOutlined Refresh small with loading
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:122-135` no refresh button
- Fix: Add Refresh with read revalidation and disabled-loading state

## G2-9-036-009  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:307-308` colored One college / Organization scope / Platform view Tag
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:105-128` plain text scope label
- Fix: Restore legacy color-coded scope chip

## G2-9-036-011  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:335-341` aria-label Search feature-control colleges and placeholder Search colleges
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:142-152` Find college / College name or code
- Fix: Restore legacy accessible placeholder/label

## G2-9-036-012  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:343-348` conditional N of M and Clear
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:199-225` always Clear plus range/total caption
- Fix: Show inline filtered count and conditionally Clear

## G2-9-036-013  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:278-286` immediate Locked at / Inherited from captions
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:40-60` Enabled/Disabled badges and hidden Rule source
- Fix: Display lock and inheritance captions without disclosure

## G2-9-036-015  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:305-306` says Courses & Content core, never turned off
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:122-125` three optional modules text lacks explicit core-course caveat
- Fix: Put exact core-module note in overview description

## G2-9-036-017  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:251-256` fixed-left College and width=140 module cells
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:233-263` columns have no fixed width specified
- Fix: Match College pinned position and each 140px module column

## G2-9-036-023  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:340-347` live client search and allowClear
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:137-205` GET submit Search, full reset Clear
- Fix: Restore live filtering or mark approved server-search change

## G2-9-036-025  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:363-364` pageSize20, size changer, X–Y of N
- vNext now: `src/modules/module-access/admin-read-service.ts:47`,209-210 fixed 20 and `src/app/(authenticated)/admin/features/page.tsx:265-310` prev/next only
- Fix: Add page-size chooser and legacy range wording

## G2-9-036-061  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:350-365` differentiates no colleges/no search hits/load failure
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:229-232` generic No colleges on this page
- Fix: Restore three distinct empty states

## G2-9-036-068  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/styles/pages/_admin-list-pages.scss:1626-1634` at max767 metrics 2 columns, at max420 1
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:130-134` uses two columns even at 375
- Fix: Use legacy 420px 1-col breakpoint for metrics

## G2-9-036-070  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/styles/pages/_admin-list-pages.scss:1626-1630` action becomes full-width on phones
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:127-135` no Refresh action
- Fix: Make restored Refresh full-width on phones

## G2-9-036-075  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:305-306` broad availability copy names Projects, Placements, Courses & Content
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:122-125` replaces with three optional modules text
- Fix: Restore legacy explanatory wording or approve updated Electives copy

## G2-9-036-076  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:335-341` placeholder Search colleges
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:149-150` placeholder College name or code
- Fix: Use legacy placeholder

## G2-9-036-101  [P2] GAP  facet F03  effort S
- Legacy: Old editability visible 'Locked at higher level' or 'Inherited from Organization' under switch `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:278-287`
- vNext now: New rule source inside disclosure `src/app/(authenticated)/admin/features/page.tsx:245-255`
- Fix: Keep lock/inherit caption immediately next to state.

## G2-9-036-108  [P2] GAP  facet F05  effort S
- Legacy: Legacy optional-module college rows page20 with size changer `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:356-365`
- vNext now: vNext typed feature list page20 fixed, Prev/Next `src/app/(authenticated)/admin/features/page.tsx:265-311`
- Fix: Restore page-size selector and Ant total range.
