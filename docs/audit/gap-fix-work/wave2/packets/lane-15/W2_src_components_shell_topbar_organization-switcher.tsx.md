# Work packet (wave 2): edit src/components/shell/topbar/organization-switcher.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-3-032-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:33-46`
- vNext now: `src/components/shell/topbar/organization-switcher.tsx:14-29`
- Fix: Legacy global superadmin context with scope and tenantLock; vNext topbar unified organization/workspace popover, preserve exact placement and lock affordance.

## G2-3-032-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:299-321`
- vNext now: `src/components/shell/topbar/organization-switcher.tsx:53-74`
- Fix: Legacy active org/college names and lock/status are projected from context throughout header; vNext topbar displays current organization and an expandable switcher.

## G2-3-032-031  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:299-321`
- vNext now: `src/components/shell/topbar/organization-switcher.tsx:54-74`
- Fix: Legacy topbar scope selectors and lock are independent controls; vNext single popover with keyboard escape and outside-click closure.

## G2-3-032-057  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:48-55`
- vNext now: `src/components/shell/topbar/organization-switcher.tsx:53-74`
- Fix: Legacy lock toggle omitted; accessible lock state/disabled explanation lost.
