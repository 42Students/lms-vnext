# Work packet: edit src/app/api/auth/admin-scope/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-1-002-039  [P1] GAP  facet F10  effort M
- Legacy: `AuthController.java:623-633` superadmin scope mints new signed JWT token pair with org/college claims.
- vNext now: `src/app/api/auth/admin-scope/route.ts:54-75` sets signed/encoded HttpOnly admin_scope cookie, no session token rotation.
- Fix: Verify request-context persistently validates active superadmin against DB on each scoped request; test stale-tab scope changes and role revocation.

## G2-1-002-029  [P2] GAP  facet F07  effort S
- Legacy: `AuthController.java:587-596,634-637` superadmin scope 400 `Invalid collegeId`/`collegeId does not belong to organizationId`, generic 500 `SCOPE_SET_FAILED`.
- vNext now: `src/modules/admin-scope/service.ts:16-25,104-156` returns `ADMIN_SCOPE_NOT_FOUND` for unknown/archived selected UUID; `src/app/api/auth/admin-scope/route.ts:75-78` uses generic apiErrorResponse.
- Fix: Provide accessible human validation of mismatched college/org and invalid selection, not only code.

## G2-3-032-027  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:214-233`
- vNext now: `src/app/api/auth/admin-scope/route.ts:40-77`
- Fix: Legacy HTTP scope failure includes type/message/status details in toast; vNext response maps error code to generic Could not change admin scope.
