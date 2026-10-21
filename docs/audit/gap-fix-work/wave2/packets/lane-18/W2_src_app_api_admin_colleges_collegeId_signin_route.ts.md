# Work packet (wave 2): edit src/app/api/admin/colleges/[collegeId]/signin/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md

## G2-4-031-003  [P2] GAP  facet F01  effort M
- Legacy: PUT branding with only loginMethods field (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:115-121`)
- vNext now: PUT `/api/admin/colleges/[collegeId]/signin` body collegeId,method,expectedVersion (`src/app/api/admin/colleges/[collegeId]/signin/route.ts:8-18`)
- Fix: Preserve v1 endpoint compatibility or migrate callers; keep optimistic concurrency.

## G2-4-031-038  [P2] GAP  facet F10  effort S
- Legacy: Save only loginMethods to existing branding endpoint (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:119-121`)
- vNext now: PUT signin policy versioned and origin guarded (`src/app/api/admin/colleges/[collegeId]/signin/route.ts:8-18`)
- Fix: Migrate frontend API or add legacy adapter; avoid altering branding fields.
