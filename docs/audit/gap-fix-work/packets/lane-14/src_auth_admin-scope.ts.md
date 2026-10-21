# Work packet: edit src/auth/admin-scope.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-3-032-065  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:272-286`
- vNext now: `src/auth/admin-scope.ts:20-54`
- Fix: Legacy UI-vs-JWT claims scopeOutOfSync warning flags silent wrong-tenant, vNext relies on request-context cookie; verify stale/invalid cookie handling and user alert.

## G2-3-032-073  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:272-286`
- vNext now: `src/auth/admin-scope.ts:20-54`
- Fix: Old explicit UI/JWT scope out-of-sync indicator absent as distinct vNext visual; add if stale cookie error can be observed.
