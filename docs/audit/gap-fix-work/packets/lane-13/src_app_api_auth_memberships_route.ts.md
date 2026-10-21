# Work packet: edit src/app/api/auth/memberships/route.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md

## G2-1-002-013  [P1] GAP  facet F04  effort L
- Legacy: `AuthController.java:343-356` POST `/switch` returns `accessToken`, `refreshToken`, `expiresIn`, `targetHost`, `hostChange`, `switchType`, `targetKey`, `collegeId`, `organizationId`, optional `handoffToken`.
- vNext now: `src/app/api/auth/memberships/route.ts:147-173` returns `{ok:true,membership}` and HttpOnly selected role/membership cookies; no tokens or redirectHost.
- Fix: Rewrite all consumers expecting token-pair/host-change fields; use safe host-aware navigation and no raw auth tokens.

## G2-1-002-021  [P1] GAP  facet F06  effort M
- Legacy: `SwitchOrgRequest.java:7-14` requires non-blank `targetKey` legacy college uniqueId/known key.
- vNext now: `src/app/api/auth/memberships/route.ts:26-29,121-128` strict object requires UUID `membershipId` and optional membership role.
- Fix: Migrate membership chooser payload shape and handling of legacy targetKey bookmarks; show validation on wrong/missing key.

## G2-1-002-037  [P1] GAP  facet F10  effort L
- Legacy: `AuthController.java:318-355` switch persists a raw access+refresh pair in `auth_handoff_token`, expiry 2 minutes; sets cookies and yields handoffToken.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` retires exchange; `src/app/api/auth/memberships/route.ts:147-173` only sets selected membership cookies.
- Fix: Choose safe target-host fresh OTP reauthentication and eliminate raw JWT handoff; explicitly track prior target and redirect.

## G2-1-002-052  [P1] GAP  facet F12  effort L
- Legacy: `AuthController.java:905-930` refresh token version per account; recruiter effective college rechecked (`:992-1009`).
- vNext now: `src/auth/session.ts:31-45` verifies user platformStatus plus active `membership` in request context; device session not bound to single role (`src/app/api/auth/memberships/route.ts:130-143`).
- Fix: Verify every authenticated API enforces active selected membership/recruiter grant and never uses stale role claims from cookies.

## G2-1-002-060  [P1] GAP  facet F16  effort M
- Legacy: `AuthController.java:220-355` cross-parent-domain handoff supports domain changes from desktop/mobile browser.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` redirects to auth entry; `auth/memberships/route.ts:68-81` rejects other tenant on current host.
- Fix: Test phone/tablet target-host re-login and return path for session transfer parity; preserve privacy/avoid URL token.

## G2-1-002-075  [P1] GAP  facet F23  effort L
- Legacy: `AuthController.java:220-356` has cross-host handoff UX and deep-link tokens; `:417-492` supports native switch-token.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` explicitly retires handoff, `auth/memberships/route.ts:98-177` browser-only cookie selector.
- Fix: Product decision: if legacy mobile/cross-domain clients remain supported, supply safe alternate flows before rollout; else document intentional retirement.

## G2-1-002-026  [P2] GAP  facet F07  effort M
- Legacy: `AuthController.java:220-256` switch responds exact errors `Unauthorized`, `Service unavailable`, `Not a member of target org`, `Invalid membership target`, `Target user not found`.
- vNext now: `src/app/api/auth/memberships/route.ts:33-60,98-143` emits codes `SESSION_*`, `MEMBERSHIP_*`, `TENANT_LOOKUP_UNAVAILABLE`, `INVALID_REQUEST`, `INVALID_ORIGIN`.
- Fix: Map error codes to legacy user-facing meaning per failure type and provide recovery actions without leaking scope.

## G2-1-002-027  [P2] GAP  facet F07  effort M
- Legacy: `AuthController.java:302-309,335-339` switch failure gives `TARGET_HOST_MISSING` or `HANDOFF_UNAVAILABLE` 503.
- vNext now: `src/app/api/auth/memberships/route.ts:68-81,98-175` scopes by current Host and refuses invalid tenant; cross-host handoff intentionally absent.
- Fix: Show target-host sign-in step rather than unavailable opaque handoff error; preserve requested target safely.
