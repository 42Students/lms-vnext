# Work packet (wave 2): edit src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-controller.md, docs/audit/gap2/lane-5/u030-manage-college-drawer.md, docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-3-028-064  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CollegeServiceImpl.java:155-190`
- vNext now: `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:42-43`
- Fix: Explicit host registration and domain verification moved to Web address step; document navigational and side-effect contract.

## G2-5-030-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy Colleges section opens `Manage College` Drawer tied to selected college record. `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:1-4,35-36`, `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:9-10`
- vNext now: vNext `Tenant setup` navigates to `/admin/colleges/{uuid}` full page. `src/app/(authenticated)/admin/colleges/page.tsx:60-65`, `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:12-27`
- Fix: Recreate contextual drawer or equivalent side panel while retaining deep link.

## G2-5-030-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy five tabs in order Web address, Sign-in, Branding, Admins, Activity. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:124-183`
- vNext now: vNext College/Activity tabs plus independent links and setup journey, not five grouped tabs. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:29-44`
- Fix: Render same tabstrip/order within tenant setup experience.

## G2-5-030-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy title college name + ID + organization tag, all always visible in drawer header. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:102-122`
- vNext now: vNext page title college name with organization in summary, no ID badge. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:18-27`
- Fix: Add college and organization badges in header.

## G2-5-030-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy 980px drawer desktop, body padding0, tabs each with 16px panel padding. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:102-123`
- vNext now: vNext full-width content page with link grid and read-only info, no drawer. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-49`
- Fix: Match 980px panel dimensions and 16px interior spacing for clone.

## G2-5-030-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy top-level content is Tabs only, no extra page intro or cards. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:124-183`
- vNext now: vNext tabstrip, setup links grid, details and activity CSV export. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:35-63`
- Fix: Move extra links/exports to secondary area without displacing original five tabs.

## G2-5-030-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy mobile drawer width100%; desktop980 threshold768. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:48-49`
- vNext now: vNext layout uses sm/md/lg responsive grids in full page. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-35`
- Fix: Reproduce width transition at 768 and modal overlay behavior.

## G2-5-030-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy header blue ID tag and Org tag with orgName fallback #orgId. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:104-113`
- vNext now: vNext college code, org and status text rows; no tag tones. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:18-24`
- Fix: Add exact ID/Org tags and fallback placeholders.

## G2-5-030-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy drawer has collegeId,orgId, name,organizationName from selected college object. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:9-11,104-113`
- vNext now: vNext fetches lifecycle detail and derives organizationName/code/status. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:15-24`
- Fix: Provide numeric legacy ID alias where needed and preserve fallback label.

## G2-5-030-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy null college shows red `Missing collegeId` and refresh guidance inside drawer. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:83-100`
- vNext now: vNext missing college notFound, no comparable nested missing-record panel. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:15-17`
- Fix: Render recoverable missing-college guidance on contextual manage action.

## G2-5-030-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy Activity embedded audit list college fixed, filters hidden. `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:21-22,89-116`
- vNext now: vNext Activity tab links `/activity?collegeId`, audit page separate with query filter. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:29-31`, `src/app/(authenticated)/admin/audit/page.tsx:10-24`
- Fix: Apply fixed college filter and suppress redundant filters when embedded.

## G2-5-030-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy tabs preserve all five content areas without route navigation. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:124-182`
- vNext now: vNext links between pages, browser back needed and selected tab resets. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:29-44`
- Fix: Preserve active tab in URL and return to same place after save.

## G2-5-030-020  [P2] GAP  facet F06  effort M
- Legacy: Legacy default active tab Web address. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:124-141`
- vNext now: vNext default college summary; requires click to Web address. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:29-44`
- Fix: Open Web address by default when entering Manage College.

## G2-5-030-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy Activity fetches scoped audit logs in drawer. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:174-179`, `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:89-116`
- vNext now: vNext activity link separate page with collegeId query. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:29-31`, `src/app/(authenticated)/admin/audit/page.tsx:10-24`
- Fix: Carry fixed college ID and restore editor tab on return.

## G2-5-030-038  [P2] GAP  facet F12  effort M
- Legacy: Legacy width <768 full otherwise980 pixels. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:48-50`
- vNext now: vNext full page responsive breakpoints vary. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-35`
- Fix: Match pixel width/breakpoint for Manage College.

## G2-5-030-041  [P2] GAP  facet F13  effort M
- Legacy: Legacy invalid college shows missing-college fallback while drawer remains open. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:83-100`
- vNext now: vNext hard 404 with no inline retry. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:15-17`
- Fix: Show bounded recoverable banner and link to college directory.

## G2-5-030-048  [P2] GAP  facet F16  effort M
- Legacy: Legacy window resize listener controls 100% vs980 width. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:35-48`
- vNext now: vNext CSS responsive full page, no resize JS. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-35`
- Fix: Compare scroll/touch at 375,768,1280 and drawer clipping.

## G2-5-030-049  [P2] GAP  facet F16  effort M
- Legacy: Legacy tag header wraps, tabs overlay can horizontally scroll. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:104-113,124-182`
- vNext now: vNext cards grid with sm2/lg3, full page. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-35`
- Fix: Check header wrap/tab scroll and 44px mobile touch targets.

## G2-5-030-050  [P2] GAP  facet F17  effort M
- Legacy: Legacy drawer maskClosable=false and keyboard disabled when busy, restore focus antd-managed. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:117-122`
- vNext now: vNext no equivalent overlay focus boundary. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-35`
- Fix: Test Escape/tab trap/restore focus and busy keyboard handling.

## G2-5-030-053  [P2] MISSING  facet F18  effort M
- Legacy: Legacy copy `Discard unsaved college setup changes?`,`Keep editing`. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:73-80`
- vNext now: vNext no corresponding text. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-49`
- Fix: Restore exact modal wording.

## G2-5-030-054  [P2] GAP  facet F18  effort M
- Legacy: Legacy fallback `Missing collegeId` and Refresh Colleges list guidance. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:83-100`
- vNext now: vNext generic notFound. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:15-17`
- Fix: Match recovery copy.

## G2-5-030-055  [P2] GAP  facet F19  effort M
- Legacy: Legacy all child tabs keep state while drawer open; tab switching no full navigation. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:124-182`
- vNext now: vNext each tab requires independent SSR fetch and route request. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:35-49`
- Fix: Cache safe reads or preserve input state through tab switches.

## G2-5-030-060  [P2] GAP  facet F21  effort M
- Legacy: Legacy child tab tree uses CollegeSubdomain,CollegeBranding,CollegeSignIn,AdminUsers,AuditLogs. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:3-7`
- vNext now: vNext routes split across domain,branding,signin,admins,activity. `src/modules/colleges/admin-tenant-setup-journey.ts:4-11`, `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:35-44`
- Fix: Expose unified setup surface while retaining services.

## G2-5-030-062  [P2] GAP  facet F22  effort M
- Legacy: Legacy college identity numeric ID/organization ID and name, admin child APIs keyed by int. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:9-11,104-113`
- vNext now: vNext UUID college/org IDs and code/status lifecycle projections. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:18-24`
- Fix: Document URL and ID mapping for deep links/existing audit rows.

## G2-9-032-007  [P2] GAP  facet F02  effort L
- Legacy: Manage College drawer overlays current list `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:673-680`
- vNext now: Tenant setup link navigates to separate detail page `src/app/(authenticated)/admin/colleges/page.tsx:60-85` `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:12-45`
- Fix: Recreate Manage drawer with tabs and unsaved close guard

## G2-9-032-074  [P2] GAP  facet F21  effort L
- Legacy: ManageCollegeDrawer integrates subdomain, branding, admins, setup and readiness `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:15-16,673-680`
- vNext now: Separate detail links replace embedded drawer components `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:35-45`
- Fix: Restore drawer parity or approved migration UX
