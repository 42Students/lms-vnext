# Verification packet (P1 sample): 2 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-004-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/companies/page.tsx
- Legacy: No-college warning with contact administrator (`docs/legacy-source/frontend/src/pages/college-admin/companies/index.js:19-31`)
- Expected fix: Show original warning and reason.

## G2-9-026-063 [P1] GAP facet F23
- Files: src/app/(authenticated)/activity/page.tsx
- Legacy: Default Important category + 30d compact segmented control `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:181-188`
- Expected fix: Default Important and preserve Super Admin audit route during category navigation.
