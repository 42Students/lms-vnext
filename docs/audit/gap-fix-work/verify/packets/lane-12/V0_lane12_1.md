# Verification packet (P0, do FIRST): 3 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-030-001 [P0] GAP facet F01
- Files: src/app/(authenticated)/superadmin/[...legacy]/page.tsx, src/modules/admin-ui/legacy-superadmin-destination-model.ts
- Legacy: audit/index.js:490-505 /superadmin/projects/audit page with Projects group tabs
- Expected fix: Redirect exact legacy /superadmin/projects/audit to protected /admin/projects/audit

## G2-7-032-001 [P0] GAP facet F01
- Files: src/app/(authenticated)/superadmin/[...legacy]/page.tsx, src/modules/admin-ui/legacy-superadmin-destination-model.ts
- Legacy: readiness/index.js:386-417 nested /superadmin/projects/readiness with SuperAdmin Projects tabs
- Expected fix: Redirect legacy route to /admin/projects/readiness under Super Admin guard

## G2-7-033-001 [P0] GAP facet F01
- Files: src/app/(authenticated)/superadmin/[...legacy]/page.tsx, src/modules/admin-ui/legacy-superadmin-destination-model.ts
- Legacy: templates/[templateId]/colleges.js:22-27 /superadmin/projects/templates/{numericId or slug}/colleges
- Expected fix: Redirect nested template-colleges legacy URL to scoped /admin/projects/templates/{UUID}/colleges with slug lookup
