# Work packet (wave 2): edit src/auth/admin-scope.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-3-032-036  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:137-193`
- vNext now: `src/auth/admin-scope.ts:20-54`
- Fix: Legacy restore from localStorage and token claims; vNext cookie encodes college:organizationId:collegeId. Clarify cross-tab/source-of-truth.

## G2-3-032-046  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:137-193`
- vNext now: `src/auth/admin-scope.ts:4-54`
- Fix: Legacy scope selection persisted by browser localStorage and JWT claims, vNext by signed session + cookie; update persistence/default docs.
