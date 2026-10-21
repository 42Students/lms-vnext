# Work packet (wave 2): edit src/app/(authenticated)/admin/organizations/page.tsx

35 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-recycle-bin-controller.md, docs/audit/gap2/lane-3/superadmin-organizations.md

## G2-2-023-002  [P2] MISSING  facet F01  effort M
- Legacy: AdminRecycleBinController.java:159-171 GET /types for restoreable types
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 only archived organizations subsection
- Fix: Expose scoped entity-type picker with platformLevel flag.

## G2-2-023-005  [P2] GAP  facet F02  effort M
- Legacy: AdminRecycleBinController.java:113-157 registry drives names/types
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 only Archived organizations disclosure
- Fix: Provide common Deleted Items nav with entity picker and row context.

## G2-2-023-006  [P2] GAP  facet F02  effort M
- Legacy: AdminRecycleBinController.java:210-214 returns id,name,subtitle for generic rows
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 shows organization-specific fields
- Fix: Use uniform table columns Name, Details, Restore for each entity.

## G2-2-023-011  [P2] MISSING  facet F04  effort M
- Legacy: AdminRecycleBinController.java:163-170 GET types `{type,label,platformLevel}`
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 uses Archived organizations local section
- Fix: Return type metadata via API for dynamic picker.

## G2-2-023-014  [P2] MISSING  facet F05  effort M
- Legacy: AdminRecycleBinController.java:113-157 LinkedHashMap entity type order
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 fixed archived organization section
- Fix: Render registry order consistently; preserve selected type in URL.

## G2-2-023-017  [P2] MISSING  facet F06  effort M
- Legacy: AdminRecycleBinController.java:177-180 entityType string required
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 no entityType input
- Fix: Validate enum nine allowed types; report invalid type.

## G2-2-023-040  [P2] MISSING  facet F13  effort M
- Legacy: AdminRecycleBinController.java:179-182 invalid entity selection 400
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 no generic picker
- Fix: Show invalid selection warning and clear option.

## G2-2-023-046  [P2] GAP  facet F15  effort M
- Legacy: AdminRecycleBinController.java:284-285 user sees success text
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 separate restore control
- Fix: Announce outcome in live status/alert for all types.

## G2-2-023-049  [P2] MISSING  facet F17  effort M
- Legacy: AdminRecycleBinController.java:159-171 supplies type label strings for accessible picker
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 generic type chooser absent
- Fix: Provide keyboard-operated list and role annotations.

## G2-2-023-051  [P2] GAP  facet F18  effort M
- Legacy: AdminRecycleBinController.java:115-156 literal Department/Program/Class/Semester/Lecture Hall/Quiz/Notification/College/Organization
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119 Archived organizations only
- Fix: Use exact type labels and heading Deleted Items.

## G2-3-030-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:167-180`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:88-100`
- Fix: Legacy Row gutter 24, left Create New Organization Card and right Existing Organizations Card; vNext stacked details + table.

## G2-3-030-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:180-206`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:99-118`
- Fix: Legacy table in bordered Card with right-aligned Input.Search/Refresh, vNext FilterBar above DataTable and separate pagination.

## G2-3-030-009  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:148-165`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:54-87`
- Fix: Legacy Name/Status/Actions columns; vNext organization name/Created/Actions, dropping always Active Tag.

## G2-3-030-010  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:167-206`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:94-98`
- Fix: Legacy always-visible create Card; vNext create in collapsed details.

## G2-3-030-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:181-187`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:99-113`
- Fix: Legacy Search organizations inline 200px small Input.Search with clear icon and Refresh button; vNext full-width search input plus Rows per page and no explicit Refresh.

## G2-3-030-016  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:148-150`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:54-87`
- Fix: Legacy column Status with green Active badge omitted; vNext adds Created date. Restore status cell.

## G2-3-030-019  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:197-204`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:39-46`
- Fix: Legacy pageSize 10,25,50,100 selection remembers in localStorage; vNext query pageSize defaults via parseAdminDirectorySearchParams and does not remember per-user.

## G2-3-030-021  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:8-9`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:99-108`
- Fix: Legacy page sizes 10,25,50,100; vNext Rows per page may offer different available values. Match exact options.

## G2-3-030-022  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:34-41`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:39-46`
- Fix: Legacy persisted page size from admin-organizations-page-size localStorage; vNext URL-based pageSize only.

## G2-3-030-023  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:195-204`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:40-46`
- Fix: Legacy Ant pagination displays page size controls, item range,total and page; vNext global Pager and summary count wording differ.

## G2-3-030-042  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:43-62`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:28-44`
- Fix: Legacy client manual Refresh with stale-data retention while loading; vNext server refresh/navigate pulls re-rendered organization list.

## G2-3-030-047  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:15-41`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:28-46`
- Fix: Legacy initial page 1 and pageSize25 (local override), vNext query page and parser defaults; ensure initial and reset-on-search parity.

## G2-3-030-049  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:43-62`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:28-44`
- Fix: Legacy has last-good-data refresh warning with Retry, first-load fatal warning and six-row TableSkeleton; vNext SSR lacks equivalent in-page stale-data state.

## G2-3-030-050  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:188-205`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:114-117`
- Fix: Legacy load error empty Unable to load organizations; use Retry above vs vNext scoped No organizations in this scope.

## G2-3-030-054  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:167-180`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:88-118`
- Fix: Legacy Row left/right two columns at lg with card framing; vNext stacked layout even desktop.

## G2-3-030-057  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:188-194`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:28-38`
- Fix: Legacy live RefreshStatus and TableSkeleton accessible text; vNext server loading/error boundary should announce equivalent.

## G2-3-030-062  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:195-204`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:40-44`
- Fix: Legacy 25/page in Ant Table limits rows; vNext pages after reading entire org list.

## G2-3-030-063  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:42-62`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:28-38`
- Fix: Legacy requestSeq rejects out-of-order refresh responses, vNext route server render isolation but no stale-data display.

## G2-3-030-066  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:1-6`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:1-27`
- Fix: Legacy Ant components, localStorage and AdminService HTTP; vNext RSC Next and internal service, different error/retry boundaries.

## G2-3-030-069  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:43-62`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:28-44`
- Fix: Legacy manual Refresh button + first/refresh-specific skeleton and Retry state absent on new directory; restore explicit controls.

## G2-3-030-071  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:167-206`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:88-118`
- Fix: Pixel clone requires side-by-side Cards and inline toolbar, not disclosed create full-width list.

## G2-2-023-052  [P3] GAP  facet F18  effort S
- Legacy: AdminRecycleBinController.java:284-285 `Records beneath it are not automatically restored.`
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:120 `Restoring an organization does not restore archived colleges.`
- Fix: Keep exact scope-aware parent-only warning, generic and tailored copy.

## G2-3-030-051  [P3] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:203-204`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:114-117`
- Fix: Legacy No matching organizations. Clear search to see all. / No organizations found. vs vNext two longer scoped messages.

## G2-3-030-059  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:149-155`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:54-87`
- Fix: Legacy Actions row Edit/Delete labels change to Rename/Archive dropdown.

## G2-3-030-060  [P3] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:188-205`
- vNext now: `src/app/(authenticated)/admin/organizations/page.tsx:114-117`
- Fix: Empty and retry messages differ; restore exact legacy copy in clone.
