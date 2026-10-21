# Work packet (wave 2): edit src/app/(authenticated)/admin/colleges/page.tsx (part 2 of 2)

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-colleges.md, docs/audit/gap2/lane-3/college-controller.md

## G2-9-032-012  [P2] GAP  facet F04  effort S
- Legacy: Columns Name, Organization, Unique ID, City, State, Actions `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:395-450`
- vNext now: Same field order but Actions header screen-reader only `src/app/(authenticated)/admin/colleges/page.tsx:28-88`
- Fix: Show visible Actions heading

## G2-9-032-013  [P2] GAP  facet F04  effort S
- Legacy: Organization fallback Org #ID when name absent `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:397-398`
- vNext now: Fallback em dash instead of ID `src/app/(authenticated)/admin/colleges/page.tsx:105-109`
- Fix: Display Org #ID safe fallback

## G2-9-032-015  [P2] GAP  facet F04  effort L
- Legacy: Manage opens drawer preloaded with organization name `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:405-448`
- vNext now: Tenant setup route shows separate read-only identity and links `src/app/(authenticated)/admin/colleges/page.tsx:62-85`
- Fix: Restore contextual drawer with subdomain, branding, admin controls

## G2-9-032-016  [P2] GAP  facet F05  effort S
- Legacy: Search name,uniqueId,city,state,organization `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:385-393`
- vNext now: Search name,code,city,organization; omits State `src/app/(authenticated)/admin/colleges/page.tsx:111-118`
- Fix: Include state in search matching

## G2-9-032-017  [P2] GAP  facet F05  effort M
- Legacy: Search width260, allowClear, live onChange `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:557-565`
- vNext now: Fullwidth GET form requires pressing Search, separate Clear `src/app/(authenticated)/admin/colleges/page.tsx:153-164`
- Fix: Match instant search, width260 and allow-clear

## G2-9-032-018  [P2] GAP  facet F05  effort M
- Legacy: Table pageSize10, size changer, x-y total `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:595-605`
- vNext now: Default pageSize25, URL-driven pagination `src/modules/colleges/admin-directory-query-model.ts:3-21` `src/app/(authenticated)/admin/colleges/page.tsx:115-121,157-171`
- Fix: Use 10 default and legacy paginator controls

## G2-9-032-019  [P2] GAP  facet F05  effort M
- Legacy: Small Ant Table with max-content horizontal scroll `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:595-602`
- vNext now: Responsive DataTable with hidden mobile columns `src/app/(authenticated)/admin/colleges/page.tsx:167-171`
- Fix: Match desktop density and horizontal overflow

## G2-9-032-020  [P2] GAP  facet F05  effort S
- Legacy: Empty No colleges match this search; otherwise No colleges found. Create an organization first, then add colleges. `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:602-605`
- vNext now: No colleges match your search or No active colleges in this scope `src/app/(authenticated)/admin/colleges/page.tsx:168-170`
- Fix: Restore both exact legacy empty messages

## G2-9-032-057  [P2] GAP  facet F13  effort M
- Legacy: Load error retains last successful colleges, warning College refresh failed + Retry `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:54-64,584-589`
- vNext now: SSR failure replaces page; no old snapshot and inline retry `src/app/(authenticated)/admin/colleges/page.tsx:101-105,129-173`
- Fix: Preserve current scoped list during Refresh failure

## G2-9-032-059  [P2] GAP  facet F13  effort S
- Legacy: Empty message distinguishes search from zero colleges with Create organization first `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:595-605`
- vNext now: No active colleges in this scope/No colleges match your search `src/app/(authenticated)/admin/colleges/page.tsx:168-170`
- Fix: Use precise legacy recovery wording

## G2-9-032-060  [P2] GAP  facet F13  effort M
- Legacy: Loading Ant Table spinner while refreshing `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:595-602`
- vNext now: Server route-level loading only `src/app/(authenticated)/admin/colleges/page.tsx:153-171`
- Fix: Show list-level refresh loading

## G2-9-032-064  [P2] GAP  facet F16  effort L
- Legacy: lg10/lg14 cards and compact Ant Table `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:455-457,551-555`
- vNext now: Stacked disclosures and responsive DataTable with link menus `src/app/(authenticated)/admin/colleges/page.tsx:129-171`
- Fix: Recreate desktop proportions and toolbar density

## G2-9-032-065  [P2] GAP  facet F17  effort S
- Legacy: Edit college NAME and Delete college NAME aria-labels `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:420-446`
- vNext now: Generic More/Edit/Archive without row name in accessible trigger `src/app/(authenticated)/admin/colleges/page.tsx:60-85` `src/components/admin/college-edit-dialog.tsx:99-114`
- Fix: Add accessible row-specific action names

## G2-9-032-067  [P2] GAP  facet F18  effort S
- Legacy: Exact Create New College and Existing Colleges Card headings `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:457-458,551-554`
- vNext now: Create College disclosure and Colleges caption `src/app/(authenticated)/admin/colleges/page.tsx:136-146,166-171`
- Fix: Match exact heading copy

## G2-9-032-068  [P2] GAP  facet F18  effort S
- Legacy: Placeholder Search college, code, city or organization `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:557-564`
- vNext now: Label same phrase but no input placeholder `src/app/(authenticated)/admin/colleges/page.tsx:153-155`
- Fix: Restore exact placeholder

## G2-9-032-070  [P2] GAP  facet F19  effort M
- Legacy: Loads whole permitted list and paginates client at 10 `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:54-80,595-602`
- vNext now: Also loads all then client server-slices at default25 `src/app/(authenticated)/admin/colleges/page.tsx:101-118`
- Fix: Match 10 visible rows, add true paging if college count huge

## G2-3-028-009  [P3] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:453-457`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:130-137`
- Fix: Use exact Create New College card title instead of Create College disclosure.

## G2-3-028-016  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:395-405`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:27-56`
- Fix: Restore exact table column heading Unique ID; vNext renders Code.

## G2-3-028-059  [P3] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:385-393`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:166-170`
- Fix: Legacy Ant Empty inside table vs No colleges match your search / No active colleges in this scope.

## G2-3-028-070  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:395-405`
- vNext now: `src/app/(authenticated)/admin/colleges/page.tsx:27-56`
- Fix: Unique ID table header changed to Code.

## G2-9-032-014  [P3] GAP  facet F04  effort S
- Legacy: Blank City/State render blank `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:399-400`
- vNext now: Blank values rendered em dash `src/app/(authenticated)/admin/colleges/page.tsx:46-54`
- Fix: Use legacy blank cell for pixel parity, retain a11y fallback

## G2-9-032-045  [P3] GAP  facet F10  effort M
- Legacy: GET colleges and orgs via AdminService; refresh list independently `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:66-80`
- vNext now: SSR listColleges + listOrganizations Promise.all `src/app/(authenticated)/admin/colleges/page.tsx:101-105`
- Fix: Provide independent retry when org read fails
