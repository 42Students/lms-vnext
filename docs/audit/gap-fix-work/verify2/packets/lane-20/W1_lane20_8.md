# Verification packet (P1 round 2): 7 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-011-020 [P1] GAP facet F05
- Files: src/components/placements/college-drive-pipeline-overview.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:151-183` — Needs attention groups have clickable specific candidate actions and status tab query
- Expected fix: Add per-candidate deep link/preserved status and explicit count

## G2-9-011-046 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:230-236` — Metric fetch error renders warning card instead of zero
- Expected fix: Show Could not load pipeline metrics in stats area

## G2-9-014-030 [P1] MISSING facet F05
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1020-1026` — First 3,000 matching can be bulk selected; warnings if more.
- Expected fix: Add cap/warning and robust page-spanning selection.

## G2-9-014-098 [P1] GAP facet F23
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1547-1600` — Legacy full shortlist workspace shows company/drive status and all pipeline statuses.
- Expected fix: Treat current view as incomplete new subset, not parity-complete.

## G2-9-028-019 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/batch-promotion/page.tsx
- Legacy: Initial active-only list, switch reveals all other statuses `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:30-32,114-119`
- Expected fix: Use strict ACTIVE default filter

## G2-9-033-090 [P1] GAP facet F15
- Files: src/modules/placements/super-admin-college-company-action-service.ts
- Legacy: Create/Update/Delete/Restore audit actions emitted by service `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:55-60,192-193,294-295,362-363,377`
- Expected fix: Mirror create and update activity audit events for college CRUD.

## G2-9-034-064 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/companies/page.tsx
- Legacy: Colleges and Drives columns widths90/80 `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:68-69`
- Expected fix: Show global platform aggregates in fixed-width table columns.

## Lane-12 fast verification triage (2026-10-22)

OK (limited to cited behavior inspected in vNext): G2-9-011-020, G2-9-011-046, G2-9-028-019.

DEFERRED — not verified or fixed; needs deeper implementation, policy, API or migration review: G2-9-014-030, G2-9-014-098, G2-9-033-090, G2-9-034-064.
Triage is complete, parity verification is not. Do not interpret deferred rows as completed fixes.
