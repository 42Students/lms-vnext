# Verification packet (P0, do FIRST): 1 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-026-038 [P0] GAP facet F18
- Files: (none, new feature)
- Legacy: Legacy Placements message redirects to placement cell Batches (service:505-507)
- Expected fix: Reconcile contradictory copy and policy, mark intentional divergence if owner chooses new hierarchy
