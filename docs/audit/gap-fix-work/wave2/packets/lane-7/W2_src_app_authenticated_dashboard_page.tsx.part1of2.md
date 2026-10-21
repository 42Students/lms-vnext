# Work packet (wave 2): edit src/app/(authenticated)/dashboard/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-dashboard.md, docs/audit/gap2/lane-10/superadmin-index.md, docs/audit/gap2/lane-9/college-admin-index.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-10-005-001  [P2] GAP  facet F01  effort S
- Legacy: Superadmin Dashboard route is /superadmin/dashboard with separate SuperAdminLayout `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:1-5` `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:43-65`
- vNext now: Superadmin is one branch of shared /dashboard route `src/app/(authenticated)/dashboard/page.tsx:478-487`
- Fix: Redirect old superadmin dashboard deep link to /dashboard with role-aware navigation

## G2-10-005-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy top PageShell title Dashboard `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:52-60`
- vNext now: vNext PageHeader title Overview with eyebrow Super Admin `src/app/(authenticated)/dashboard/page.tsx:113-119`
- Fix: Restore Dashboard page title and old title typography

## G2-10-005-003  [P2] GAP  facet F01  effort M
- Legacy: Global first card navigates to Tenant setup /superadmin/tenants `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:18-24`
- vNext now: New top metrics link Organizations /admin/organizations and Colleges /admin/colleges `src/app/(authenticated)/dashboard/page.tsx:120-133`
- Fix: Keep Tenant setup shortcut in primary hero with corrected route /admin/tenants

## G2-10-005-004  [P2] GAP  facet F01  effort S
- Legacy: Global second shortcut Feature controls /superadmin/features `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:25-30`
- vNext now: New metric row Departments/People and global links relegated beneath metrics `src/app/(authenticated)/dashboard/page.tsx:134-165` `src/components/admin/admin-dashboard-actions.tsx:97-115`
- Fix: Restore Feature controls as second prominent shortcut

## G2-10-005-005  [P2] GAP  facet F01  effort S
- Legacy: Global third shortcut Activity log /superadmin/audit `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:31-36`
- vNext now: New global quick links are below metric area; no top Activity log card `src/app/(authenticated)/dashboard/page.tsx:120-165` `src/components/admin/admin-dashboard-actions.tsx:98-114`
- Fix: Position Activity log as third global hero card

## G2-10-005-006  [P2] GAP  facet F01  effort S
- Legacy: Global fourth shortcut Recruiter accounts /superadmin/recruiters `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:37-42`
- vNext now: New top metric People points /admin/people; recruiter shortcut not in top metrics `src/app/(authenticated)/dashboard/page.tsx:143-151` `src/components/admin/admin-dashboard-actions.tsx:98-114`
- Fix: Restore Recruiter accounts fourth global shortcut and mapped href

## G2-10-005-008  [P2] GAP  facet F02  effort M
- Legacy: College view starts Selected college operations greeting; At a glance; Today; Quick Actions; bottom utility buttons `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:82-95`
- vNext now: New college view has Overview header, universal four metrics, At a glance Today, Safety scope, actions `src/app/(authenticated)/dashboard/page.tsx:113-165`
- Fix: Restore college greeting and section order; move scope details to old header-level placement

## G2-10-005-009  [P2] GAP  facet F02  effort S
- Legacy: Global platform hero uses eyebrow + h2 + explanatory paragraph `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:49-55`
- vNext now: New is PageHeader followed by stat grid, and separate platform quick links with a shortened heading `src/app/(authenticated)/dashboard/page.tsx:113-153` `src/components/admin/admin-dashboard-actions.tsx:98-113`
- Fix: Render the original hero eyebrow, large title and paragraph together above cards

## G2-10-005-010  [P2] MISSING  facet F02  effort S
- Legacy: Bottom college utility actions Back to tenant setup and Platform activity `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:91-94`
- vNext now: No bottom utility buttons in SuperAdminDashboard after quick actions `src/app/(authenticated)/dashboard/page.tsx:154-166`
- Fix: Add both legacy actions after the scoped quick action grid

## G2-10-005-019  [P2] GAP  facet F04  effort S
- Legacy: College greeting says Selected college operations and Super Admin scoped view `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:84-87`
- vNext now: New eyebrow Super Admin title Overview and scopeLabel in description `src/app/(authenticated)/dashboard/page.tsx:107-119`
- Fix: Restore greeting wording while preserving visible current college name

## G2-10-005-044  [P2] GAP  facet F13  effort M
- Legacy: Old glance fetch starts loading skeleton then clear errors with explicit banner `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:16-46` `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:74-88`
- vNext now: New SSR initial fetch and skeleton only when counts null AND refreshing `src/app/(authenticated)/dashboard/page.tsx:104-105` `src/components/admin/college-at-glance-panel.tsx:17-50`
- Fix: Show first-load skeleton while fetching and avoid dropping to blank cards when initial error

## G2-10-005-045  [P2] MISSING  facet F13  effort M
- Legacy: Old Today six skeleton cards while loading and per-card failed state `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:23-48` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:125-149`
- vNext now: New Today rendered immediately from optional null snapshot, no skeleton/per-card error state `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:4-24`
- Fix: Restore card-level skeleton, failed and all-clear states

## G2-10-005-049  [P2] GAP  facet F16  effort S
- Legacy: Old global hero card grid two columns from sm and four links only `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:57-72`
- vNext now: New metric card grid two at 768 and four at xl `src/app/(authenticated)/dashboard/page.tsx:120-153`
- Fix: Use old visual two-column global cards and breakpoint

## G2-10-005-055  [P2] GAP  facet F18  effort S
- Legacy: Legacy main page title Dashboard `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:52-56`
- vNext now: New header title Overview `src/app/(authenticated)/dashboard/page.tsx:113-119`
- Fix: Use Dashboard as title

## G2-10-005-056  [P2] GAP  facet F18  effort S
- Legacy: Global eyebrow Platform operations and title Choose the level you need to operate at. `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:49-53`
- vNext now: New only shortcut section repeats title later; Header title Overview `src/components/admin/admin-dashboard-actions.tsx:98-107` `src/app/(authenticated)/dashboard/page.tsx:113-119`
- Fix: Restore Platform operations eyebrow and main hero h2 above cards

## G2-10-005-058  [P2] GAP  facet F18  effort S
- Legacy: Scoped heading Selected college operations and Super Admin scoped view `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:84-87`
- vNext now: New selected-college scope label and Overview heading `src/app/(authenticated)/dashboard/page.tsx:107-119`
- Fix: Restore scoped hello copy and hierarchy

## G2-10-005-064  [P2] GAP  facet F20  effort M
- Legacy: Old AttentionBoard suppresses duplicate refresh in loadInFlightRef and keeps prior data on same scope `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:70-99`
- vNext now: New Today has no refresh requests, only SSR snapshot `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:3-24`
- Fix: Support deduplicated scoped refresh with last good data and explicit failure

## G2-10-010-005  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Sidebar/SuperAdminSidebar.js:65-66` sidebar brand logo links /superadmin/dashboard
- vNext now: `src/app/(authenticated)/dashboard/page.tsx:83-119` SuperAdminDashboard exists at /dashboard
- Fix: Align logo/home destination and legacy root with one canonical Overview route

## G2-10-010-048  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:43-59` destination Dashboard reads selected college via context
- vNext now: `src/app/(authenticated)/dashboard/page.tsx:83-111` dashboard reads organisations/colleges; `src/app/(authenticated)/admin/academics/page.tsx:35-53` no-college empty
- Fix: Correct target so intended dashboard data model is reachable from old root

## G2-9-009-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — Redirect Location exactly /college-admin/dashboard
- vNext now: `src/app/(authenticated)/dashboard/page.tsx:478-523` — Generic /dashboard chooses among roles and membership, not fixed College Admin destination
- Fix: Ensure legacy deep link resolves a College Admin dashboard, not a generic role chooser

## G2-9-035-001  [P2] GAP  facet F01  effort S
- Legacy: Superadmin Dashboard route is /superadmin/dashboard with separate SuperAdminLayout `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:1-5` `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:43-65`
- vNext now: Superadmin is one branch of shared /dashboard route `src/app/(authenticated)/dashboard/page.tsx:478-487`
- Fix: Redirect old superadmin dashboard deep link to /dashboard with role-aware navigation

## G2-9-035-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy top PageShell title Dashboard `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:52-60`
- vNext now: vNext PageHeader title Overview with eyebrow Super Admin `src/app/(authenticated)/dashboard/page.tsx:113-119`
- Fix: Restore Dashboard page title and old title typography

## G2-9-035-003  [P2] GAP  facet F01  effort M
- Legacy: Global first card navigates to Tenant setup /superadmin/tenants `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:18-24`
- vNext now: New top metrics link Organizations /admin/organizations and Colleges /admin/colleges `src/app/(authenticated)/dashboard/page.tsx:120-133`
- Fix: Keep Tenant setup shortcut in primary hero with corrected route /admin/tenants

## G2-9-035-004  [P2] GAP  facet F01  effort S
- Legacy: Global second shortcut Feature controls /superadmin/features `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:25-30`
- vNext now: New metric row Departments/People and global links relegated beneath metrics `src/app/(authenticated)/dashboard/page.tsx:134-165` `src/components/admin/admin-dashboard-actions.tsx:97-115`
- Fix: Restore Feature controls as second prominent shortcut

## G2-9-035-005  [P2] GAP  facet F01  effort S
- Legacy: Global third shortcut Activity log /superadmin/audit `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:31-36`
- vNext now: New global quick links are below metric area; no top Activity log card `src/app/(authenticated)/dashboard/page.tsx:120-165` `src/components/admin/admin-dashboard-actions.tsx:98-114`
- Fix: Position Activity log as third global hero card

## G2-9-035-006  [P2] GAP  facet F01  effort S
- Legacy: Global fourth shortcut Recruiter accounts /superadmin/recruiters `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:37-42`
- vNext now: New top metric People points /admin/people; recruiter shortcut not in top metrics `src/app/(authenticated)/dashboard/page.tsx:143-151` `src/components/admin/admin-dashboard-actions.tsx:98-114`
- Fix: Restore Recruiter accounts fourth global shortcut and mapped href

## G2-9-035-008  [P2] GAP  facet F02  effort M
- Legacy: College view starts Selected college operations greeting; At a glance; Today; Quick Actions; bottom utility buttons `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:82-95`
- vNext now: New college view has Overview header, universal four metrics, At a glance Today, Safety scope, actions `src/app/(authenticated)/dashboard/page.tsx:113-165`
- Fix: Restore college greeting and section order; move scope details to old header-level placement

## G2-9-035-009  [P2] GAP  facet F02  effort S
- Legacy: Global platform hero uses eyebrow + h2 + explanatory paragraph `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:49-55`
- vNext now: New is PageHeader followed by stat grid, and separate platform quick links with a shortened heading `src/app/(authenticated)/dashboard/page.tsx:113-153` `src/components/admin/admin-dashboard-actions.tsx:98-113`
- Fix: Render the original hero eyebrow, large title and paragraph together above cards

## G2-9-035-010  [P2] MISSING  facet F02  effort S
- Legacy: Bottom college utility actions Back to tenant setup and Platform activity `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:91-94`
- vNext now: No bottom utility buttons in SuperAdminDashboard after quick actions `src/app/(authenticated)/dashboard/page.tsx:154-166`
- Fix: Add both legacy actions after the scoped quick action grid

## G2-9-035-019  [P2] GAP  facet F04  effort S
- Legacy: College greeting says Selected college operations and Super Admin scoped view `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:84-87`
- vNext now: New eyebrow Super Admin title Overview and scopeLabel in description `src/app/(authenticated)/dashboard/page.tsx:107-119`
- Fix: Restore greeting wording while preserving visible current college name

## G2-9-035-044  [P2] GAP  facet F13  effort M
- Legacy: Old glance fetch starts loading skeleton then clear errors with explicit banner `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:16-46` `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:74-88`
- vNext now: New SSR initial fetch and skeleton only when counts null AND refreshing `src/app/(authenticated)/dashboard/page.tsx:104-105` `src/components/admin/college-at-glance-panel.tsx:17-50`
- Fix: Show first-load skeleton while fetching and avoid dropping to blank cards when initial error

## G2-9-035-045  [P2] MISSING  facet F13  effort M
- Legacy: Old Today six skeleton cards while loading and per-card failed state `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:23-48` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:125-149`
- vNext now: New Today rendered immediately from optional null snapshot, no skeleton/per-card error state `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:4-24`
- Fix: Restore card-level skeleton, failed and all-clear states

## G2-9-035-049  [P2] GAP  facet F16  effort S
- Legacy: Old global hero card grid two columns from sm and four links only `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:57-72`
- vNext now: New metric card grid two at 768 and four at xl `src/app/(authenticated)/dashboard/page.tsx:120-153`
- Fix: Use old visual two-column global cards and breakpoint

## G2-9-035-055  [P2] GAP  facet F18  effort S
- Legacy: Legacy main page title Dashboard `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:52-56`
- vNext now: New header title Overview `src/app/(authenticated)/dashboard/page.tsx:113-119`
- Fix: Use Dashboard as title

## G2-9-035-056  [P2] GAP  facet F18  effort S
- Legacy: Global eyebrow Platform operations and title Choose the level you need to operate at. `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:49-53`
- vNext now: New only shortcut section repeats title later; Header title Overview `src/components/admin/admin-dashboard-actions.tsx:98-107` `src/app/(authenticated)/dashboard/page.tsx:113-119`
- Fix: Restore Platform operations eyebrow and main hero h2 above cards

## G2-9-035-058  [P2] GAP  facet F18  effort S
- Legacy: Scoped heading Selected college operations and Super Admin scoped view `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:84-87`
- vNext now: New selected-college scope label and Overview heading `src/app/(authenticated)/dashboard/page.tsx:107-119`
- Fix: Restore scoped hello copy and hierarchy

## G2-9-035-064  [P2] GAP  facet F20  effort M
- Legacy: Old AttentionBoard suppresses duplicate refresh in loadInFlightRef and keeps prior data on same scope `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:70-99`
- vNext now: New Today has no refresh requests, only SSR snapshot `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:3-24`
- Fix: Support deduplicated scoped refresh with last good data and explicit failure

## G2-9-035-073  [P2] GAP  facet F01  effort S
- Legacy: Legacy bare /superadmin redirects 302 to /superadmin/dashboard `docs/legacy-source/frontend/src/pages/superadmin/index.js:9-18`
- vNext now: vNext common /dashboard dispatch checks isSuperAdmin(context) `src/app/(authenticated)/dashboard/page.tsx:478-487`
- Fix: Map historical bare /superadmin and /superadmin/dashboard URLs onto canonical /dashboard with role preservation.

## G2-9-035-078  [P2] GAP  facet F02  effort M
- Legacy: Global hero section eyebrow Platform operations then h2 and paragraph `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:48-55`
- vNext now: vNext only global action section heading below metric grid `src/app/(authenticated)/dashboard/page.tsx:120-165`
- Fix: Restore original hero before links and above any optional metric rows.

## G2-9-035-079  [P2] GAP  facet F02  effort S
- Legacy: Global scope-tip at bottom with apartment icon `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:74-77`
- vNext now: Safety scope details appear before shortcut grid `src/app/(authenticated)/dashboard/page.tsx:156-165`
- Fix: Move/select-college tip after global card grid and restore apartment icon.
