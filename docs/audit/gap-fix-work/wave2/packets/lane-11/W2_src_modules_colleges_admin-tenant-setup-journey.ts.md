# Work packet (wave 2): edit src/modules/colleges/admin-tenant-setup-journey.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u030-manage-college-drawer.md

## G2-5-030-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy tabs display concise labels and selected ink bar. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:124-182`
- vNext now: vNext setup links labelled Identity & brand, Sign-in methods, Web address etc. `src/modules/colleges/admin-tenant-setup-journey.ts:4-11`
- Fix: Use literal `Web address`, `Sign-in`, `Branding`, `Admins`, `Activity` labels.

## G2-5-030-052  [P2] GAP  facet F18  effort M
- Legacy: Legacy tab labels `Web address`, `Sign-in`, `Branding`, `Admins`, `Activity`. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:124-182`
- vNext now: vNext `Identity & brand`, `Sign-in methods`, `Web address`, etc. `src/modules/colleges/admin-tenant-setup-journey.ts:4-11`
- Fix: Use exact labels inside grouped setup tabstrip.

## G2-5-030-060  [P2] GAP  facet F21  effort M
- Legacy: Legacy child tab tree uses CollegeSubdomain,CollegeBranding,CollegeSignIn,AdminUsers,AuditLogs. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:3-7`
- vNext now: vNext routes split across domain,branding,signin,admins,activity. `src/modules/colleges/admin-tenant-setup-journey.ts:4-11`, `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:35-44`
- Fix: Expose unified setup surface while retaining services.
