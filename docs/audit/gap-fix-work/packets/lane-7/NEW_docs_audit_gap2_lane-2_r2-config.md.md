# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/r2-config.md

3 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/r2-config.md

## G2-2-004-008  [P1] GAP  facet F06  effort S
- Legacy: LC:34-44 @Value missing defaults empty string
- vNext now: NC:20-26 all four trimmed and nonblank required
- Fix: Update provisioning/playbook and fail capability gracefully where unset.

## G2-2-004-012  [P1] GAP  facet F07  effort S
- Legacy: LC:30-32 skips all beans when account absent via LR:15-18
- vNext now: NC:17-25 throws when called with invalid config
- Fix: Guard runtime upload/download operations and return 503 rather than crashing routes.

## G2-2-004-011  [P2] GAP  facet F07  effort S
- Legacy: LC:53-55 throws 'R2 account ID is required but not configured'
- vNext now: NC:24-26 throws PRIVATE_STORAGE_NOT_CONFIGURED
- Fix: Map typed error to safe setup message and ops diagnostic.
