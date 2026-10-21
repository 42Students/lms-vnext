# Work packet: edit src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u030-manage-college-drawer.md, docs/audit/gap2/lane-9/superadmin-college-branding.md

## G2-5-030-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy children expose onDirtyChange/onBusyChange for domains, sign-in, branding, admins. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:13-33`
- vNext now: vNext each page owns form state; no shared cross-section dirty registry. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:14-39`, `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:12-34`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-61`, `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:14-44`
- Fix: Use shared setup controller or route blockers that track dirty/busy per section.

## G2-9-030-025  [P2] GAP  facet F07  effort M
- Legacy: Load fallback Couldn't load branding for this college. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:48-67`
- vNext now: Server errors not shown in in-card alert `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:30-33`
- Fix: Provide retryable inline error

## G2-9-030-029  [P2] GAP  facet F08  effort S
- Legacy: Unsaved branding changes were discarded because selected college changed `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:74-77`
- vNext now: No matching scope-change message `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:47-55`
- Fix: Restore warning
