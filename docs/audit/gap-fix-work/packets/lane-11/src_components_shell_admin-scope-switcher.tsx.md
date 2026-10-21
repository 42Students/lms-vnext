# Work packet: edit src/components/shell/admin-scope-switcher.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-3-032-026  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:183-197`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:68-78`
- Fix: Legacy Couldn't switch to your saved college. Pick it again from the header. / Failed to load colleges. Please refresh. vs new generic inline error.

## G2-3-032-029  [P3] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:250-250`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:124-126`
- Fix: Old scope cleared warning toast vs new inline Showing all colleges — data may be large.
