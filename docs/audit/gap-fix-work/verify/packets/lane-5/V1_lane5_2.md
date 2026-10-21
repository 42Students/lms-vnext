# Verification packet (P1 sample): 1 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-033-073 [P1] MISSING facet F06
- Files: src/components/admin/super-admin-college-company-actions.tsx
- Legacy: Contact person max150, 'Recruiter contact name' `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:498-500`
- Expected fix: Restore per-college contact person field max150.
