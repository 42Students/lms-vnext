# Verification packet (P1 round 2): 2 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-13-025-036 [P1] GAP facet F16
- Files: src/modules/placements/recruiter-self-grants-service.ts
- Legacy: Pending recruiter can be college-less, list not scoped to current college `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:19-29`
- Expected fix: Place responsive pending panel outside active-college-only shell.

## G2-9-029-012 [P1] MISSING facet F03
- Files: src/app/(authenticated)/admin/batches/page.tsx
- Legacy: Toolbar search, refresh, row count and batches.csv export `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-548`
- Expected fix: Restore CSV export filtered rows
