# Work packet (wave 2): edit src/app/(authenticated)/admin/hr/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md, docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md

## G2-10-021-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/recruiters.js:6-14 — /superadmin/recruiters under placements tab and scope picker; selected org/college passed to component.
- vNext now: src/app/(authenticated)/admin/recruiters/page.tsx:1-6; src/app/(authenticated)/admin/hr/page.tsx:26-41 — Alias /admin/recruiters to /admin/hr; scope resolved from request context.
- Fix: Restore Placement group nav and legacy route context labels.

## G2-10-021-018  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:399-401 — Active/Suspended/Deleted metrics counted on page rows.
- vNext now: src/app/(authenticated)/admin/hr/page.tsx:122-127; src/components/admin/super-admin-hr-accounts.tsx:682-684 — global status summary separately queried, not current page counts.
- Fix: Render page-local lifecycle metrics with correct labels.

## G2-10-021-051  [P2] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:97-122; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:67-73 — GET recruiter accounts q/page/size25, backend applies org/college.
- vNext now: src/app/(authenticated)/admin/hr/page.tsx:71-114; src/modules/placements/super-admin-hr-service.ts:278-426 — Direct scoped DB server list with URL query/status.
- Fix: Verify same grant-history inclusion and filter semantics.

## G2-3-031-020  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:37-40`
- vNext now: `src/app/(authenticated)/admin/hr/page.tsx:129-167`
- Fix: Legacy page zero-based with `size=25` and live Search; vNext page one-based URL q/status/pageSize.

## G2-3-031-047  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:54-60`
- vNext now: `src/app/(authenticated)/admin/hr/page.tsx:174-187`
- Fix: Legacy scope key resets page/query upon college selection; vNext keyed page instance + query persisted URL. Match reset rules.

## G2-3-031-049  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:97-123`
- vNext now: `src/app/(authenticated)/admin/hr/page.tsx:116-128`
- Fix: Legacy initial list loading spinner, failure alert, manual Retry and college-option warning; vNext RSC loadError and totals summary fallback.

## G2-3-031-065  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:124-148`
- vNext now: `src/app/(authenticated)/admin/hr/page.tsx:174-187`
- Fix: Legacy visible scope-change warning for unsaved edit; vNext remount by key may silently discard draft.
