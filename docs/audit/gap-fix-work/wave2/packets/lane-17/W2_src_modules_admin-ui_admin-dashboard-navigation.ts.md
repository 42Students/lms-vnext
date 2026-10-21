# Work packet (wave 2): edit src/modules/admin-ui/admin-dashboard-navigation.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-dashboard.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-9-005-004  [P2] GAP  facet F01  effort M
- Legacy: 19 key quick-action route map, including lessons, lesson-content, quiz, placements (`docs/legacy-source/frontend/src/pages/college-admin/dashboard.js:11-34`)
- vNext now: 11 quick actions plus setup routes, vNext remaps lesson-content to videos (`src/modules/admin-ui/admin-dashboard-navigation.ts:8-22`)
- Fix: Retain each legacy route and action target semantics.

## G2-9-035-074  [P2] GAP  facet F01  effort S
- Legacy: Legacy global platform card order Tenant setup / Feature controls / Activity log / Recruiter accounts `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:18-43`
- vNext now: New global links Tenant Setup / Recruiter accounts / Feature Controls / Activity Log `src/modules/admin-ui/admin-dashboard-navigation.ts:78-83`
- Fix: Restore exact four-card order as old.

## G2-9-035-085  [P2] GAP  facet F04  effort S
- Legacy: Global Tenant setup subtitle 'Create and manage colleges, domains and tenant settings.' `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:20-24`
- vNext now: New Tenant Setup subtitle about organizations/colleges before scope `src/modules/admin-ui/admin-dashboard-navigation.ts:79`
- Fix: Restore exact supporting card description.

## G2-9-035-086  [P2] GAP  facet F04  effort S
- Legacy: Global Feature controls subtitle 'Control platform capabilities and rollout state.' `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:25-29`
- vNext now: New 'Review platform features and access controls.' `src/modules/admin-ui/admin-dashboard-navigation.ts:81`
- Fix: Restore exact shortcut description.

## G2-9-035-087  [P2] GAP  facet F04  effort S
- Legacy: Global Activity log subtitle 'Investigate important changes across the platform.' `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:31-35`
- vNext now: New 'Review activity across the platform within your permissions.' `src/modules/admin-ui/admin-dashboard-navigation.ts:82`
- Fix: Restore old Activity log subtitle.

## G2-9-035-088  [P2] GAP  facet F04  effort S
- Legacy: Global Recruiter accounts subtitle 'Manage recruiter identities that can span colleges.' `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:37-42`
- vNext now: New 'Inspect recruiter access and account records across the platform.' `src/modules/admin-ui/admin-dashboard-navigation.ts:80`
- Fix: Restore old Recruiter accounts subtitle.

## G2-9-035-075  [P3] GAP  facet F01  effort S
- Legacy: Legacy global 'Tenant setup' capitalization `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:20-24`
- vNext now: New 'Tenant Setup' capitalization `src/modules/admin-ui/admin-dashboard-navigation.ts:79`
- Fix: Use exact Tenant setup string.

## G2-9-035-076  [P3] GAP  facet F01  effort S
- Legacy: Legacy global 'Feature controls' capitalization `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:25-29`
- vNext now: New 'Feature Controls' `src/modules/admin-ui/admin-dashboard-navigation.ts:81`
- Fix: Match Feature controls casing.

## G2-9-035-077  [P3] GAP  facet F01  effort S
- Legacy: Legacy 'Activity log' lower-case log `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:31-35`
- vNext now: New 'Activity Log' `src/modules/admin-ui/admin-dashboard-navigation.ts:82`
- Fix: Match Activity log casing.
