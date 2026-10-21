# Work packet: edit src/app/auth/handoff/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/auth-handoff-page.md, docs/audit/gap2/lane-1/auth-handoff-token.md

## G2-1-002-037  [P1] GAP  facet F10  effort L
- Legacy: `AuthController.java:318-355` switch persists a raw access+refresh pair in `auth_handoff_token`, expiry 2 minutes; sets cookies and yields handoffToken.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` retires exchange; `src/app/api/auth/memberships/route.ts:147-173` only sets selected membership cookies.
- Fix: Choose safe target-host fresh OTP reauthentication and eliminate raw JWT handoff; explicitly track prior target and redirect.

## G2-1-002-060  [P1] GAP  facet F16  effort M
- Legacy: `AuthController.java:220-355` cross-parent-domain handoff supports domain changes from desktop/mobile browser.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` redirects to auth entry; `auth/memberships/route.ts:68-81` rejects other tenant on current host.
- Fix: Test phone/tablet target-host re-login and return path for session transfer parity; preserve privacy/avoid URL token.

## G2-1-002-075  [P1] GAP  facet F23  effort L
- Legacy: `AuthController.java:220-356` has cross-host handoff UX and deep-link tokens; `:417-492` supports native switch-token.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` explicitly retires handoff, `auth/memberships/route.ts:98-177` browser-only cookie selector.
- Fix: Product decision: if legacy mobile/cross-domain clients remain supported, supply safe alternate flows before rollout; else document intentional retirement.

## G2-1-024-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/frontend/src/utils/switchMembership.js:20-30: cross-host membership switch navigates to targetHost/auth/handoff?token=...&next=... .
- vNext now: src/app/auth/handoff/page.tsx:3-7: immediately redirects to /?auth=handoff-retired; no token consume.
- Fix: Supply secure verified cross-host switch journey or formal full re-login transition with safe returnTo.

## G2-1-024-026  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:107-108: unauthenticated Api.post /api/v1/auth/handoff/consume with {token}, skipAuth true.
- vNext now: src/app/auth/handoff/page.tsx:3-7: no exchange API; src/app/api/auth/handoff/consume/route.ts: NONE.
- Fix: If cross-host must work, implement short-lived HMAC code exchange with replay exclusion and verified tenant domain.

## G2-1-002-028  [P2] GAP  facet F07  effort S
- Legacy: `AuthController.java:501-517` handoff errors 400 `token required`, 404 `Invalid token`, 410 `Expired token`.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` unconditional `/?auth=handoff-retired` redirect.
- Fix: Differentiate retired, missing, expired, reused handoff where safe, with clear 'Sign in again' instruction.

## G2-1-024-021  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:127-135: API error from response.data.error/message, default `Handoff failed`; AntD message.error.
- vNext now: src/app/auth/handoff/page.tsx:6-7: no consume and no server error rendering.
- Fix: Implement safe failure/toast if secure exchange reintroduced.

## G2-1-014-021  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:498-504`: service unavailable 503 or missing token 400.
- vNext now: `src/app/auth/handoff/page.tsx:3-7`: redirect, no backend error code.
- Fix: Document public error-response migration and frontend fallback.

## G2-1-014-023  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:540-547`: successful consume returns ok true/user data.
- vNext now: `src/app/auth/handoff/page.tsx:3-7`: retired redirect, no success toast.
- Fix: After first-party sign-in show selected membership success state.
