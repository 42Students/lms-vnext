# Verification packet (P1 round 2): 5 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-014-052 [P1] GAP facet F10
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:900-913` — GET applications CSV export filters by current status, department, source, batch, search.
- Expected fix: Match selected shortlist stage/filter semantics and full export reach.

## G2-9-026-017 [P1] GAP facet F05
- Files: src/app/(authenticated)/activity/page.tsx
- Legacy: Filter category important/setup/people/teaching/projects/all mapped to server category `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:23-30,100-107`
- Expected fix: Compare legacy category action-key catalog and reproduce 'Important' event definition.

## G2-9-026-020 [P1] GAP facet F05
- Files: src/modules/activity/super-admin-audit-route-query-model.ts
- Legacy: Super Admin org-only scope is supported without college `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:4-35`
- Expected fix: Document scope and pass org-only context correctly to read/export.

## G2-9-027-017 [P1] GAP facet F05
- Files: src/modules/activity/super-admin-audit-route-query-model.ts
- Legacy: Filters actionKey, actorUserId, orgId, collegeId, entityId, date range `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:31-35,65-78`
- Expected fix: Implement old raw actionKey/entity filter semantics and field mapping.

## G2-9-023-055 [P1] MISSING facet F14
- Files: src/app/(authenticated)/admin/batches/page.tsx
- Legacy: batches.csv export filtered rows with key fields `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-548`
- Expected fix: Reinstate CSV export with legacy headers, code-injection safety
