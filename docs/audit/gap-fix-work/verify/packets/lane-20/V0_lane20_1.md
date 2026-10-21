# Verification packet (P0, do FIRST): 3 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-002-037 [P0] MISSING facet F06
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: Offer/LOI kind default OFFER, CTC form `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:744`
- Expected fix: Build full selection form

## G2-2-012-032 [P0] GAP facet F12
- Files: (none, new feature)
- Legacy: LC:160-170 attendance under threshold based on ALL marked sessions not exception records
- Expected fix: Rewrite at-risk query FROM marked attendanceSessions CROSS JOIN eligible enrolled learners LEFT JOIN exceptions; missing record = PRESENT. This is a fundamental false-risk dashboard calculation.

## G2-7-035-001 [P0] GAP facet F01
- Files: src/app/(authenticated)/superadmin/[...legacy]/page.tsx
- Legacy: templates/[templateId]/overview.js:153-156 /superadmin/projects/templates/{numeric/slug}/overview
- Expected fix: Add safe historical template overview redirect to /admin/projects/templates/{UUID}
