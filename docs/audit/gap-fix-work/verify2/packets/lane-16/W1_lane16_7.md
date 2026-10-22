# Verification packet (P1 round 2): 8 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-002-048 [P1] GAP facet F11
- Files: src/app/(authenticated)/college/batch-promotion/page.tsx
- Legacy: No college alert, not redirect (`docs/legacy-source/frontend/src/pages/college-admin/batch-promotion.js:20-31`)
- Expected fix: Show Admin not assigned to a college warning and Contact administrator.

## G2-9-008-030 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/hiring-dashboard/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:87-168` — Three metrics/funnel/company requests fail independently with partial success retained
- Expected fix: Introduce sectional results and recoverable independent failures

## G2-9-010-061 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1529-1542` — Refreshing applications indicator and recoverable list warning with Retry
- Expected fix: Add independent list fetch error, Retry and stale scoped results handling

## G2-9-011-029 [P1] GAP facet F08
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:230-236` — Metric load warning Could not load pipeline metrics with failure description
- Expected fix: Render metric warning independently of job header

## G2-9-014-017 [P1] GAP facet F04
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1256-1310` — Learner Name, Email, College, Source, Current Status, Applied Date, Age, Match Score and Actions.
- Expected fix: Add legacy columns in order, relegate extra Roll/Role to configurable columns.

## G2-9-014-072 [P1] MISSING facet F15
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1950-1975` — Assessment modal confirms candidates receive in-app notification.
- Expected fix: Restore assessment distribution notification message.

## G2-9-027-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/audit/page.tsx, src/app/(authenticated)/activity/page.tsx
- Legacy: Raw audit log shared component supports fixedCollegeId, allowGlobal, fixedEntityId and hideFilters `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:21-32`
- Expected fix: Add faithful raw Audit Logs subview including fixed-entity and scoped modes.

## G2-9-033-012 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/companies/page.tsx
- Legacy: Old college record has industry, logo, private contacts, notes, drive count and last active `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:242-295` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:140-150`
- Expected fix: Restore need-to-know private contact and notes access only under college scope
