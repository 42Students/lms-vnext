# Verification packet (P0, do FIRST): 1 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-3-010-031 [P0] GAP facet F22
- Files: src/modules/storage/private-object-storage.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:19-31`
- Expected fix: Old interim publicly reachable bucket vs new production refuses shared bucket, plan migration/verification and remove exposed originals.
