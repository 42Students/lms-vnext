# Verification packet (P0, do FIRST): 2 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-032-068 [P0] MISSING facet F23
- Files: (none, new feature)
- Legacy: Legacy actual spring scheduler active from app initialization. `docs/planning/database-parity-db10-scheduler-runner-handoff.md:14-16`
- Expected fix: Mark production scheduler parity blocked until adapter and triggers live.

## G2-8-025-001 [P0] GAP facet F01
- Files: (none, new feature)
- Legacy: Legacy GET /api/v1/resource-files/{contentId}/materials/{materialIndex}/url resolves one indexed FILE (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:37-53).
- Expected fix: Add learner/staff authorized per-material UUID download endpoint, not just root content reference.
