# Work packet (wave 2): edit src/app/(authenticated)/admin/module-access/page.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-4/superadmin-module-access.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-019-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/module-access.js:14-23 — PageShell title Module Access wraps hierarchy without extra navigation step.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:40-77; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:104-112 — Directory requires click on each college, changing route to /admin/features/:collegeId.
- Fix: Restore direct route workflow and back/active sidebar parity.

## G2-10-019-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:603-641 — AdminControlOverview then one Card with info banner and tree.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:40-80 — PageHeader, metrics, filter, college list; entirely different order.
- Fix: Use legacy overview and one canvas tree in order.

## G2-10-019-010  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:625-636 — Five actions recent changes, expand all, collapse all, refresh and learner search.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:40-60 — Has Feature Controls/Filter/Clear but not those actions.
- Fix: Restore controls with source disabled rules.

## G2-10-019-013  [P2] MISSING  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:686-693 — Warning badge with count of learner override/lock and Review action.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:49-50; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:112-126 — Count metric but no count-triggered Review banner.
- Fix: Show exact warning/review affordance.

## G2-10-019-069  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/module-access.js:15-22 — Scope absent shows warning Alert and skips data tree requests.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:39-80 — Shows directory and scope stats rather than warning.
- Fix: Show legacy missing scope warning with no stale edit affordance.

## G2-10-019-085  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:607-608 — 'Optional module access hierarchy' and exact description 'Use this page for inherited Projects/Placements access below the college level...'
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:45-46 — Heading same but description absent/rewritten.
- Fix: Restore source text and visual placement.

## G2-10-019-087  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:625-636 — Buttons 'Recent changes', 'Expand all', 'Collapse all', 'Refresh'.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:40-61 — Buttons 'Feature Controls', 'Filter', 'Clear filters'.
- Fix: Restore source buttons in hierarchy header.

## G2-4-030-001  [P2] GAP  facet F01  effort M
- Legacy: Existing ModuleAccess section receives selected collegeId and optional isSuperAdmin (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:135-145`)
- vNext now: Module Access route is college-directory landing, requires subsequent college click (`src/app/(authenticated)/admin/module-access/page.tsx:23-42`)
- Fix: Keep direct acting-college hierarchy entry when a college is already selected.

## G2-4-030-002  [P2] GAP  facet F01  effort M
- Legacy: Page heading Optional module access hierarchy and effective access overview (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:603-609`)
- vNext now: Root adds independent Module Access heading and college-search list (`src/app/(authenticated)/admin/module-access/page.tsx:39-50`)
- Fix: Match original heading hierarchy and overview placement.

## G2-4-030-005  [P2] GAP  facet F02  effort M
- Legacy: AdminControlOverview with eyebrow, title, description, 3 stats and actions (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:603-639`)
- vNext now: Root has 3 stats and college search, no action row (`src/app/(authenticated)/admin/module-access/page.tsx:40-51`)
- Fix: Recreate same header-to-toolbar order.

## G2-4-030-014  [P2] GAP  facet F04  effort M
- Legacy: Stats Hierarchy scopes numeric, largest scope population, student overrides count (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:611-615`)
- vNext now: First stat literal list of scope labels, other stats computed visible-college aggregate (`src/app/(authenticated)/admin/module-access/page.tsx:46-50`)
- Fix: Show selected college tree node count and student population.

## G2-4-030-021  [P2] GAP  facet F05  effort M
- Legacy: History drawer table 15/page (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:719-726`)
- vNext now: Root college table paged, history moved to another URL (`src/app/(authenticated)/admin/module-access/page.tsx:39-84`)
- Fix: Use history drawer with pageSize 15 and separate history data.

## G2-4-030-053  [P2] GAP  facet F13  effort M
- Legacy: No college clears tree, counters, overrides and error (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:199-209`)
- vNext now: Initial route shows all visible colleges rather than no-college empty hierarchy (`src/app/(authenticated)/admin/module-access/page.tsx:40-84`)
- Fix: Show exact no-college warning in former section container.

## G2-4-030-054  [P2] GAP  facet F13  effort S
- Legacy: No college warning Pick a college first so this page does not show stale access data (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:660-668`)
- vNext now: Generic select-a-college description (`src/app/(authenticated)/admin/module-access/page.tsx:39-42`)
- Fix: Restore prominent warning copy with scoped-table hidden.

## G2-4-030-066  [P2] GAP  facet F18  effort M
- Legacy: Title Optional module access hierarchy; subtitle Use this page for inherited Projects/Placements access (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:606-609`)
- vNext now: Title Module Access, subtitle select college; hierarchy title in lower h2 (`src/app/(authenticated)/admin/module-access/page.tsx:40-45`)
- Fix: Restore legacy title/subtitle at selected-college page.

## G2-9-036-097  [P2] GAP  facet F01  effort S
- Legacy: Old college feature flag request path /superadmin/features? college scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:75-101`
- vNext now: New College Module Access link is /admin/features/[collegeId] `src/app/(authenticated)/admin/module-access/page.tsx:68-77`
- Fix: Preserve old entry point routing and back navigation from new editor.
