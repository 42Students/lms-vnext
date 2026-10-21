# Work packet: edit src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u030-manage-college-drawer.md, docs/audit/gap2/lane-5/u031-admin-users.md

## G2-5-030-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy children expose onDirtyChange/onBusyChange for domains, sign-in, branding, admins. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:13-33`
- vNext now: vNext each page owns form state; no shared cross-section dirty registry. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:14-39`, `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:12-34`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-61`, `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:14-44`
- Fix: Use shared setup controller or route blockers that track dirty/busy per section.

## G2-5-031-003  [P1] GAP  facet F01  effort M
- Legacy: Legacy `Sessions`,`History`,`Delete` row actions in table. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:318-346`
- vNext now: vNext View active devices/View history linked pages, Access disclosure, no Delete. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:35-42`
- Fix: Restore permanent delete where permitted and compact inline actions.

## G2-5-031-009  [P1] GAP  facet F03  effort M
- Legacy: Legacy Sessions and History small buttons with tooltips; Delete disabled until suspended. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:322-326,335-344`
- vNext now: vNext View active devices/History links, no tooltip or delete. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:39-41`
- Fix: Add direct permanent Delete disabled-state and tooltips.

## G2-5-031-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy columns Name, Role, Mobile, Email, Org, College, Enabled, Sessions, Actions. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:295-301`
- vNext now: vNext columns Name, Email, Roles, Status, Access, Sessions, History, no Mobile/Org/College. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:34-42`
- Fix: Restore mobile and organization context in scoped admin table.

## G2-5-031-016  [P1] GAP  facet F05  effort M
- Legacy: Legacy table paginates 25 per page with horizontal scroll1080. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:469-475`
- vNext now: vNext DataTable has no explicit 25-page pagination on page, truncated first500. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:32-44`
- Fix: Implement server pagination 25 default with filters and count.

## G2-5-031-029  [P1] MISSING  facet F08  effort M
- Legacy: Legacy delete toast `Admin deleted.`. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:243-246`
- vNext now: vNext lacks delete action. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:32-44`
- Fix: Add permanent deletion receipt when safe and authorized.

## G2-5-031-032  [P1] MISSING  facet F09  effort M
- Legacy: Legacy permanent Delete confirmation with irrevocable warning, blocked if teaching/mentoring. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:228-249`
- vNext now: vNext no permanent Delete control/modal. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:30-44`
- Fix: Restore role-aware delete flow after suspension and dependency checks.

## G2-5-031-038  [P1] MISSING  facet F10  effort M
- Legacy: Legacy permanent deleteFaculty(id) only after suspended, audit preserved. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:221-250`, `docs/legacy-source/frontend/src/api/Services/AdminService.js:1-16`
- vNext now: vNext no direct permanent delete operation on this screen. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:32-44`
- Fix: Add safe deletion only after all dependency checks and immutable audit retained.

## G2-5-031-043  [P1] GAP  facet F12  effort M
- Legacy: Legacy suspend reversible, hard Delete only when already suspended, and project dependencies block. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:202-249`
- vNext now: vNext suspends membership but no permanent delete; reason min3 enforced. `src/components/admin/college-admin-lifecycle-action.tsx:20-35`, `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:39-42`
- Fix: Implement audited hard-delete policy or explicitly sunset with owner approval.
