# Verification packet (P1 sample): 1 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-016-063 [P1] GAP facet F11
- Files: src/app/(authenticated)/college/placements/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/index.js:33-39` — AdminGroupShell placements gates module availability.
- Expected fix: Restore disabled placements explanation and actions.
