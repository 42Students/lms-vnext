# Work packet (wave 2): edit src/app/auth/handoff/page.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/auth-handoff-page.md, docs/audit/gap2/lane-1/auth-handoff-token.md

## G2-1-002-015  [P2] GAP  facet F04  effort M
- Legacy: `AuthController.java:519-550` handoff consume returns `{ok:true,auth:AuthResponse}` or raw tokens when identity hydration unavailable.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` ignores old handoff and redirects to fresh sign in; no response object for old consumers.
- Fix: Handle handoff-retired error in UI and map old response expectations; never expose raw tokens.

## G2-1-002-022  [P2] MISSING  facet F06  effort S
- Legacy: `AuthController.java:494-504` handoff body token optional map but then nonempty `token` required, responds 400 `token required`.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` never parses query or POST handoff body.
- Fix: Do not silently parse/redeem retired tokens; direct invalid/expired handoff callers to safe sign-in with explicit message.

## G2-1-002-038  [P2] GAP  facet F10  effort M
- Legacy: `AuthController.java:514-520`, `AuthHandoffToken.java:15-28` consumes handoff once via DB conditional claim and sets cookies.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` has no token-consume write; vNext first-party session created on code verification (`src/app/api/auth/login/verify/route.ts:46-62`).
- Fix: Document intentional retirement and exercise deep-link/cross-domain fallback with signed-in origin and target.

## G2-1-002-049  [P2] GAP  facet F12  effort S
- Legacy: `AuthController.java:325-331` handoff token random UUID sans hyphens with 2-minute TTL and `used=false`.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` refuses all handoffs; login session TTL five days (`src/modules/auth/config.ts:25-26`).
- Fix: Document user journey when reaching expired/reused handoff and deep links; no raw token recreation.

## G2-1-002-055  [P2] GAP  facet F13  effort S
- Legacy: `AuthController.java:494-517` 410 Expired token for prior handoff.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` all tokens redirect `/?auth=handoff-retired`.
- Fix: Show retired handoff error with safe sign-in button and intended-college context; avoid silent generic login.

## G2-1-002-063  [P2] GAP  facet F18  effort M
- Legacy: `AuthController.java:220-239` errors `Not a member of target org`; `:498-516` `token required`, `Invalid token`, `Expired token`.
- vNext now: `src/app/api/auth/memberships/route.ts:33-60,121-145`, `auth/handoff/page.tsx:3-8` machine-coded errors/redirect.
- Fix: Build literal old-to-new copy mapping at UI boundary; retain type-safe machine codes.

## G2-1-002-072  [P2] GAP  facet F22  effort M
- Legacy: `AuthHandoffToken.java:10-28` JPA `auth_handoff_token` stores raw access/refresh token and used/expiry; `AuthController.java:319-331,514-519` writes/reads.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts` candidate is staged, not live; `src/app/auth/handoff/page.tsx:3-8` retired; `drizzle/0056_identity_auth_sessions.sql:41-72` uses session digest.
- Fix: Do not port raw-token storage; document secure alternative or explicit removal in migration disposition.

## G2-1-024-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:20-32: reads token and next from router query; token required, next must start single slash.
- vNext now: src/app/auth/handoff/page.tsx:6-7: ignores both query values and redirects to login.
- Fix: Document lost next-path and prevent leaking token in query/analytics.

## G2-1-024-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:146-172: full-height main, flex-centered horizontally and vertically with 24px padding.
- vNext now: src/app/auth/handoff/page.tsx:1-9: no rendered handoff screen; N:116-178 uses brand login viewport/card.
- Fix: If transition screen kept, clone centered neutral canvas with exact dimensions.

## G2-1-024-006  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:149-169: loading spinner+caption, else error heading/body/actions, else idle caption.
- vNext now: src/app/auth/handoff/page.tsx:6-7: redirect with no loading/error/idle section.
- Fix: Represent these states or record explicit retired redirect as accepted.

## G2-1-024-013  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:17-23: targetLabel from localStorage lms_handoff_target_label, query token trimmed.
- vNext now: src/app/auth/handoff/page.tsx:6-7: neither value used; login banner does not identify target organization.
- Fix: Recover intended target from verified server scope instead of arbitrary localStorage label.

## G2-1-024-037  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:149-169: 3 distinct loading/error/idle states plus target text.
- vNext now: src/app/auth/handoff/page.tsx:6-7: always redirects; N:150-155 shows one retired-warning state.
- Fix: Show active handoff states or document retired UX divergence.

## G2-1-024-038  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:127-139: failure leaves page with Retry and login; loading reset in finally.
- vNext now: src/app/auth/handoff/page.tsx:6-7: no Retry, next transition is re-login only.
- Fix: Offer explicit restart action for broken handoff journeys.

## G2-1-014-002  [P2] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:494-505`: POST /handoff/consume accepts JSON token.
- vNext now: `src/app/auth/handoff/page.tsx:3-7`: token URL ignored and redirected; no matching consume route.
- Fix: Publish compatibility notice and safe code-based handoff plan if required.

## G2-1-014-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:319-320`: redirect flow appends /auth/handoff?token=... at target.
- vNext now: `src/app/auth/handoff/page.tsx:6-7`: route redirects to `/?auth=handoff-retired`.
- Fix: Show explanatory session-restarter and return URL only after validated origin.

## G2-1-014-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:349-355`: switch result exposes targetKey and handoffToken for redirect.
- vNext now: `src/app/auth/handoff/page.tsx:3-7`: no token or selected target shown.
- Fix: Preserve known target destination in safe local sign-in cue without token.

## G2-1-014-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:494-520`: consume sets cookies and returns hydrated auth result.
- vNext now: `src/app/auth/handoff/page.tsx:3-7`: static retired redirect no success confirmation.
- Fix: Provide post-relogin success cue for account/college change.

## G2-1-014-018  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:501-504`: token required and trim; empty -> 400 token required.
- vNext now: `src/app/auth/handoff/page.tsx:3-7`: ignores token input entirely, immediate redirect.
- Fix: Keep neutral retired-token response with no token in logs/referrer.

## G2-1-014-020  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:509-517`: expired token ->410 Expired token, marks used.
- vNext now: `src/app/auth/handoff/page.tsx:3-7`: generic retired state; does not distinguish expiry.
- Fix: Display safe generic expiry/retired copy, avoid exposing whether token existed.

## G2-1-014-038  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:319-320`: backend frontend handoff URL consumed on target host.
- vNext now: `src/app/auth/handoff/page.tsx:1-8`: redirects on server, no mobile intermediate layout.
- Fix: Present responsive re-login instruction instead of invisible redirect loop.

## G2-1-014-041  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:502-517`: `token required`, `Invalid token`, `Expired token`.
- vNext now: `src/app/auth/handoff/page.tsx:3-7`: query auth=handoff-retired, generic notice elsewhere.
- Fix: Provide exact actionable retired handoff explanation, not raw codes.

## G2-1-014-042  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:335-338`: HANDOFF_UNAVAILABLE error for failed switch.
- vNext now: `src/app/auth/handoff/page.tsx:3-7`: no switch confirmation, user must sign in again.
- Fix: Explain deliberate fresh login when switching colleges.

## G2-1-024-007  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:151: AntD <Spin size='large'> on loading.
- vNext now: src/app/auth/handoff/page.tsx:6-7: no spinner.
- Fix: Preserve large spinner only if cross-host handoff feature reinstated.

## G2-1-024-012  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:167: idle `Preparing account switch - {targetLabel}` or ellipsis.
- vNext now: src/app/auth/handoff/page.tsx:6-7: no idle preflight text.
- Fix: Preserve short transition affordance if enabled.

## G2-1-024-029  [P3] GAP  facet F10  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:110: localStorage.removeItem('lms_handoff_target_label') on API success.
- vNext now: src/app/auth/handoff/page.tsx:6-7: never removes pending legacy targetLabel; old localStorage persists.
- Fix: Clean legacy handoff-target local storage when landing on retired link.

## G2-1-024-042  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:147-148: full viewport, 24px padding, max 520px centered.
- vNext now: src/app/auth/handoff/page.tsx:6-7: no responsive handoff page; N:116-178 themed responsive login.
- Fix: If retained, match 24px padding and centered max width.
