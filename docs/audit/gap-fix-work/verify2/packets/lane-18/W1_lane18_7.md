# Verification packet (P1 round 2): 3 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-15-017-044 [P1] GAP facet F20
- Files: src/modules/projects/mentor-resource-audit-model.ts
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V197__project_resource_creator_type.sql:6-20 backfill original actor role from first UPSERT audit
- Expected fix: Store immutable creator role and guard cross-role ID collisions

## G2-9-027-045 [P1] GAP facet F14
- Files: src/app/(authenticated)/activity/page.tsx
- Legacy: Export only current filtered loaded page with 8 columns `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:155-184`
- Expected fix: Document and offer current-page export vs full export distinctly.

## G2-9-034-007 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/companies/page.tsx
- Legacy: Old global companies render Antd table with Company Domains Added by Colleges Drives Actions columns `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:59-81`
- Expected fix: Add global distinct-company table with exact old column set; separate college relationships detail view

## Lane-3 FINAL verification triage (2026-10-22)

- OK G2-9-027-045: Activity page explicitly offers current loaded page CSV with eight forensic headers, separately from all-matching export.
- DEFERRED G2-15-017-044: creator role audit model guards role+ID and records original actor, but historical first-UPSERT backfill/persistent immutability needs data-layer verification.
- DEFERRED G2-9-034-007: global company catalogue exists; exact five-column legacy presentation requires deeper full component and relationship review.
