# Work packet (wave 2): edit src/app/api/auth/admin-scope/route.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-1-002-001  [P2] GAP  facet F01  effort M
- Legacy: `AuthController.java:53,142-181` GET `/api/v1/auth/memberships` reachable from account/college switching.
- vNext now: `src/app/api/auth/memberships/route.ts:83-96` GET `/api/auth/memberships`; `src/app/api/auth/admin-scope/route.ts:18-30` splits Super Admin scope.
- Fix: Document replacement routes for legacy clients, and update navigation to membership chooser versus admin scope picker.

## G2-1-002-004  [P2] GAP  facet F01  effort M
- Legacy: `AuthController.java:557-638` POST `/superadmin/scope` chooses platform-root org/college context.
- vNext now: `src/app/api/auth/admin-scope/route.ts:18-110` provides GET/POST/DELETE selector under `/api/auth/admin-scope`.
- Fix: Update superadmin entry and state machine for signed cookie scope and clear-to-global action.

## G2-3-032-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:137-193`
- vNext now: `src/app/api/auth/admin-scope/route.ts:18-29`
- Fix: Legacy restores saved scope on provider mount; vNext request context resolves signed cookie, no same saved-college reapply confirmation.

## G2-3-032-025  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:246-250`
- vNext now: `src/app/api/auth/admin-scope/route.ts:81-106`
- Fix: Legacy clearing college selection auto-clears organization and saved ID; vNext explicit DELETE admin-scope, select value empty.

## G2-3-032-034  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:95-109`
- vNext now: `src/app/api/auth/admin-scope/route.ts:32-79`
- Fix: Legacy applying scope rotates access and refresh JWTs; vNext sets HttpOnly lms_admin_scope cookie without rotating login identity.

## G2-3-032-035  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:214-270`
- vNext now: `src/app/api/auth/admin-scope/route.ts:81-110`
- Fix: Legacy clear scope handled by POST null college/org; vNext DELETE route clears cookie.

## G2-3-032-048  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:95-109`
- vNext now: `src/app/api/auth/admin-scope/route.ts:32-79`
- Fix: Legacy fetch/access token refresh race can fail with 403 and wrong-tenant warning; vNext server scope cookie retains old scope on failure, different stale-session messages.
