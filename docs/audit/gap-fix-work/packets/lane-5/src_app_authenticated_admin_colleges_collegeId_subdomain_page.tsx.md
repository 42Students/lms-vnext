# Work packet: edit src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u030-manage-college-drawer.md, docs/audit/gap2/lane-9/superadmin-college-subdomain.md

## G2-5-030-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy children expose onDirtyChange/onBusyChange for domains, sign-in, branding, admins. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:13-33`
- vNext now: vNext each page owns form state; no shared cross-section dirty registry. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:14-39`, `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:12-34`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-61`, `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:14-44`
- Fix: Use shared setup controller or route blockers that track dirty/busy per section.

## G2-9-031-028  [P2] GAP  facet F07  effort M
- Legacy: Load failure Couldn't load the web address, with loading spinner `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:127-127`
- vNext now: Server failure thrown; no per-card error banner `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:20-23`
- Fix: Restore load Retry error state.
