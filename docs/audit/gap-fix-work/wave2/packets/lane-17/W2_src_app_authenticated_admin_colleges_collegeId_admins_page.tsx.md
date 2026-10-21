# Work packet (wave 2): edit src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u030-manage-college-drawer.md, docs/audit/gap2/lane-5/u031-admin-users.md

## G2-5-030-033  [P2] GAP  facet F10  effort M
- Legacy: Legacy AdminUsers creates/changes college admin identities and sessions from drawer. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:162-170`, `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:144-182`
- vNext now: vNext PersonOnboardDialog and lifecycle actions, separate Admins page. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:20-44`
- Fix: Preserve create/disable/session actions in closeable admin panel.

## G2-5-030-056  [P2] GAP  facet F19  effort M
- Legacy: Legacy AdminUsers and AuditLogs can page/search in-place. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:91-104`, `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:323-326`
- vNext now: vNext admin directory first500 truncation notice; activity page paged. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:32-44`, `src/app/(authenticated)/admin/audit/page.tsx:10-24`
- Fix: Expose proper pagination beyond 500 records.

## G2-5-031-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy AdminUsers embedded in ManageCollegeDrawer, requires fixedCollegeId or displays `Select a College to manage Admins`. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:23-27,350-358`
- vNext now: vNext dedicated `/admin/colleges/{uuid}/admins` page; scope from route. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:14-29`
- Fix: Expose old drawer Admins tab with same scope fallback.

## G2-5-031-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy create card above list card, role-segmented College Admins/TPOs. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:361-439`
- vNext now: vNext PageHeader, two Onboard person buttons and one combined table. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:20-43`
- Fix: Recreate create-first card and role-tabbed list.

## G2-5-031-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy create Card titled `Create College Admin or TPO`; form grid three columns at desktop. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:361-426`
- vNext now: vNext separate modal onboarding, not inline card. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:20-29`, `src/components/admin/person-onboard-dialog.tsx:118-155`
- Fix: Match inline create form dimensions/ordering.

## G2-5-031-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy list Card title role-based, Segmented role tabs, Refresh then table. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:428-477`
- vNext now: vNext single DataTable all roles, no Segmented or Refresh. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:30-43`
- Fix: Add segmented roles and explicit reload button.

## G2-5-031-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy sessions modal 760px and history modal 900px. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:479-581`
- vNext now: vNext sessions/history separate pages, no inline modals. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:40-41`
- Fix: Provide quick-view overlays while retaining deep links.

## G2-5-031-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy roles College Admin and TPO (Training & Placement Officer), tab labels College Admins/TPOs. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:17-21,432-438`
- vNext now: vNext role names College Admin, TPO; no full parenthetical helper. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:21-31`
- Fix: Use legacy full role label and segmented role chips.

## G2-5-031-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy per-row Enabled Switch, red Suspended tag. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:303-314`
- vNext now: vNext status badge and Access disclosure with action buttons. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:38-39`, `src/components/admin/college-admin-lifecycle-action.tsx:20-61`
- Fix: Restore visible enabled switch with confirmation, preserve added suspension reason.

## G2-5-031-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy names First+Last fallback `#ID`, role rendered Tag with readable label. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:295-301`
- vNext now: vNext name displayName, roles comma list, email Not recorded fallback. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:35-38`
- Fix: Map first/last and ID fallback plus role badges.

## G2-5-031-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy refreshing keeps last loaded role rows and displays RefreshStatus. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:128-129,455-468`
- vNext now: vNext SSR page read with no cached previous rows or retry. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:14-21`
- Fix: Add in-place refresh/stale banner after failed refetch.

## G2-5-031-045  [P2] GAP  facet F12  effort M
- Legacy: Legacy managed role enum ADMIN,TPO mapped from facultyType. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:17-21`
- vNext now: vNext roles COLLEGE_ADMIN,TPO membership roles. `src/modules/colleges/admin-session-service.ts:45-51`, `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:37-38`
- Fix: Map historic faculty ADMIN to College Admin membership for reporting.

## G2-5-031-046  [P2] GAP  facet F13  effort M
- Legacy: Legacy stale-data refresh status, skeleton8x7, error retry with last good role rows. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:455-477`
- vNext now: vNext SSR page, no inline refresh/skeleton in these components. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:14-43`
- Fix: Add proper loading/error/retry states preserving authorized results.

## G2-5-031-048  [P2] GAP  facet F13  effort M
- Legacy: Legacy select-college warning exact wording. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:350-358`
- vNext now: vNext route can render error/redirect, not inline warning. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:14-19`
- Fix: Preserve select-college guidance.

## G2-5-031-053  [P2] GAP  facet F16  effort M
- Legacy: Legacy roster scroll x1080; sessions modal 760 and history900. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:469-475,513-514`
- vNext now: vNext responsive DataTable and dedicated pages. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:32-44`
- Fix: Compare 375/768/1280 and overlay width.

## G2-5-031-056  [P2] GAP  facet F18  effort M
- Legacy: Legacy `Create College Admin or TPO`, `Admin user was not created`. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:363-372`
- vNext now: vNext `College Admin and TPO accounts` + `Onboard person`. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:21-31`, `src/components/admin/person-onboard-dialog.tsx:89-100`
- Fix: Match exact card/error headings.

## G2-5-031-057  [P2] GAP  facet F18  effort M
- Legacy: Legacy `College Admins`,`TPOs`,`Refresh`. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:429-438`
- vNext now: vNext no Segmented or Refresh; role combined. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:31-42`
- Fix: Restore labels/buttons.

## G2-5-031-058  [P2] GAP  facet F18  effort M
- Legacy: Legacy `Active sessions — Name`, `Sign out everywhere`. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:482-510`
- vNext now: vNext link `View active devices`. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:40-41`
- Fix: Match session-action words while keeping link.
