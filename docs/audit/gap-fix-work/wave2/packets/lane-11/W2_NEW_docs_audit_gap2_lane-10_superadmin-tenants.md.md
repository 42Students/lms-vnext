# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-10/superadmin-tenants.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md

## G2-10-023-025  [P2] GAP  facet F05  effort M
- Legacy: src/modules/colleges/admin-tenant-lifecycle-service.ts:61-65 — New directory sorts college name/id asc, page20.
- vNext now: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:595-608 — Legacy Table client list/pagination 25, API/source order.
- Fix: Match legacy size25 and visible sort, or show explicit sort

## G2-10-023-026  [P2] GAP  facet F05  effort M
- Legacy: src/app/(authenticated)/admin/tenants/page.tsx:90-113 — Directory columns College/Org/Lifecycle/Location/Action.
- vNext now: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:376-450 — Legacy Colleges columns differ incl management actions.
- Fix: Use legacy list columns in setup, lifecycle directory remains distinct
