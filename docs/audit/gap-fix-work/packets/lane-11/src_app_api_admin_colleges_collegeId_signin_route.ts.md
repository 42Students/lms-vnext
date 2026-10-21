# Work packet: edit src/app/api/admin/colleges/[collegeId]/signin/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md

## G2-4-031-029  [P2] GAP  facet F07  effort S
- Legacy: GET payload accepts data.branding or data.data.branding aliases (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:99-100`)
- vNext now: PUT result `{policy}`; read delivered via SSR, no old response alias (`src/app/api/admin/colleges/[collegeId]/signin/route.ts:8-18`)
- Fix: Add legacy GET shape compatibility for old clients.
