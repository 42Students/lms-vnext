# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/superadmin-login.md

8 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-login.md

## G2-6-031-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy route /superadmin-login is its own unauthenticated page and is explicitly nolayout, not redirected (superadmin-login.js:6-25).
- vNext now: vNext /superadmin-login immediately redirects /login (superadmin-login/page.tsx:1-6).
- Fix: Restore legacy route's recognizable branded login surface or record approved single-login consolidation and preserve returnTo.

## G2-6-031-019  [P1] GAP  facet F06  effort M
- Legacy: Legacy required OTP Terms checkbox before Login enabled; unchecked disables submit (SuperAdminLogin.js:192-215).
- vNext now: vNext LoginConsent paragraph, no terms checkbox; verification enabled when code complete (login-form.tsx:512-555,561-570).
- Fix: Confirm whether explicit consent is still legally required; if yes restore checkbox/disabled rule with acknowledgement tracking.

## G2-6-031-038  [P1] GAP  facet F12  effort M
- Legacy: Legacy termsChecked starts false each render; login only if true (SuperAdminLogin.js:35,192-215).
- vNext now: vNext consent is informational under each step, no checked/recorded state (login-form.tsx:561-570).
- Fix: Get owner/legal decision on affirmative consent vs informational text.

## G2-6-031-022  [P2] GAP  facet F07  effort S
- Legacy: Legacy unregistered phone on send failure shows exact Please Enter registered mobile number (SuperAdminLogin.js:151-158,323-326).
- vNext now: vNext maps NOT_REGISTERED to This number isn't registered. Check it, or sign in with your email. (login-form.tsx:52-66).
- Fix: Restore exact text or document improved actionable contact language.

## G2-6-031-023  [P2] GAP  facet F07  effort S
- Legacy: Legacy wrong OTP toast OTP InValid! duration2s (SuperAdminLogin.js:290-299).
- vNext now: vNext inline error That code isn't right. Check it and try again. (login-form.tsx:62-70,166-184).
- Fix: Match message and toast duration/position if strict clone outweighs usability.

## G2-6-031-024  [P2] GAP  facet F07  effort S
- Legacy: Legacy required OTP message Please input OTP! from AntD Form.Item (SuperAdminLogin.js:174-180).
- vNext now: vNext Verify button disabled until length6, no identical required-field validation (login-form.tsx:512-520).
- Fix: Show exact error message on attempted empty submit; ensure keyboard flow.

## G2-6-031-026  [P2] GAP  facet F08  effort S
- Legacy: Legacy send success toast OTP Sent! lasting2 seconds (SuperAdminLogin.js:310-321).
- vNext now: vNext inline notice Your code is on its way. and cooldown (login-form.tsx:225-242,343-349).
- Fix: Match literal OTP Sent! toast style/duration if parity required.

## G2-6-031-027  [P3] GAP  facet F08  effort S
- Legacy: Legacy session-expired info toast Your session expired. Please log in again. duration4 (SuperAdminLogin.js:43-46).
- vNext now: vNext alert title same string and additional description on /login?auth=expired (app/page.tsx:29-34,160-169).
- Fix: Match placement and 4-second toast if route-specific parity; retain accessible persistent alert if approved.
