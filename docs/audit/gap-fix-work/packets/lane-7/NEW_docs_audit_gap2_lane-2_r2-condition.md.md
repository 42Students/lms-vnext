# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/r2-condition.md

4 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/r2-condition.md

## G2-2-002-007  [P1] GAP  facet F06  effort S
- Legacy: LC:15-18 only one condition input r2.account.id
- vNext now: NC:20-26 requires account, access key, secret key, private bucket
- Fix: Align deployment readiness semantics; ensure missing secret/bucket fails closed with explicit setup instructions.

## G2-2-002-010  [P1] GAP  facet F07  effort S
- Legacy: LC:15-18 false returns silent exclusion; no error message
- vNext now: NC:24-26 throws PRIVATE_STORAGE_NOT_CONFIGURED
- Fix: Handle missing config at per-feature boundary with typed 503/configure message; ensure other unrelated routes remain functional.

## G2-2-002-017  [P1] GAP  facet F12  effort S
- Legacy: LC:16-17 property hasText for r2.account.id, ignores credentials and bucket
- vNext now: NC:20-26 all 4 secrets required
- Fix: Document new all-or-nothing readiness invariant and ensure all provisioning guides reflect it.

## G2-2-002-019  [P1] GAP  facet F13  effort S
- Legacy: LC:16-17 false makes R2StorageUtils bean absent (LU:29-31)
- vNext now: NC:24-26 missing R2 config throws only when getPrivateR2Config called
- Fix: Ensure consumers show unavailable capability rather than 500, and avoid loading dependent route before guard.
