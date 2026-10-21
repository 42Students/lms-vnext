# Verification packet (P0, do FIRST): 2 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-002-094 [P0] MISSING facet F22
- Files: src/modules/placements/hr-job-read-service.ts
- Legacy: Backend POST selection list `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:178`
- Expected fix: Implement selection write

## G2-19-026-019 [P0] GAP facet F08
- Files: (none, new feature)
- Legacy: Bulk success `{module,enabled,updated}` all-or-nothing after validation (ModuleAccessService:697-713)
- Expected fix: Do not claim atomic bulk parity; either transactional preflight+write or explicit per-learner partial semantics and retry-only failures
