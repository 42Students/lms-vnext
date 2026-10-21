# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/superadmin-login.md

12 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-login.md

## G2-6-031-003  [P2] GAP  facet F01  effort S
- Legacy: Legacy uses separate page head title Superadmin - 42 LMS and description Superadmin Login, favicon /favicon.svg (superadmin-login.js:9-14).
- vNext now: vNext /login page metadata Sign in · 42LMS or collegeName; no superadmin-specific title (app/page.tsx:14-19; superadmin-login/page.tsx:1-6).
- Fix: Set per-route metadata for preserved bookmark or document consolidated title.

## G2-6-031-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy mobile step changes same Form view under ln-form-bg, and loading state replaces whole Login-Section with Loader (SuperAdminLogin.js:92-99,245-250).
- vNext now: vNext login card persists and busy button/notice while network operation (login-form.tsx:317-351,432-440,512-554).
- Fix: Recreate legacy full-page preloader only where requested or document accessibility-focused new state.

## G2-6-031-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy first screen label Mobile Number (capital N), placeholder Enter mobile number, Send OTP (SuperAdminLogin.js:119-165).
- vNext now: vNext label Mobile number, placeholder 98765 43210, CTA Continue (login-form.tsx:407-438).
- Fix: Match exact mobile label, placeholder and Send OTP text.

## G2-6-031-009  [P2] GAP  facet F03  effort S
- Legacy: Legacy OTP label OTP sent to your Mobile Number, placeholder Enter OTP, button Login (SuperAdminLogin.js:168-211).
- vNext now: vNext Enter your code heading, masked contact text, One-time code label, placeholder Enter the code, Verify and sign in (login-form.tsx:317-325,457-485,512-523).
- Fix: Use literal legacy labels/CTA or owner-approved explicit 2FA copy shift.

## G2-6-031-011  [P2] GAP  facet F03  effort S
- Legacy: Legacy login-page has separate terms/privacy footer and JRSPF copyright inside form (SuperAdminLogin.js:220-242).
- vNext now: vNext global footer copyright and Privacy/Terms links outside card (app/page.tsx:182-190).
- Fix: Match footer alignment/spacing and exact link strings.

## G2-6-031-017  [P2] GAP  facet F06  effort S
- Legacy: Legacy mobile input type tel, inputMode numeric, autoFocus, onWheel blur; max10 typed characters (SuperAdminLogin.js:131-154).
- vNext now: vNext input type tel, inputMode tel, autoComplete tel, no maxLength shown (login-form.tsx:411-424).
- Fix: Match numeric keyboard hint, 10-digit UI ceiling, focus/scroll behavior where safe.

## G2-6-031-033  [P2] GAP  facet F10  effort M
- Legacy: Legacy isLoggedIn redirects to /superadmin/dashboard with 8-second fallback and loop detection (SuperAdminLogin.js:47-88).
- vNext now: vNext server isSignedIn redirect safeReturnTo or /dashboard (app/page.tsx:21-26,94-106).
- Fix: Ensure role-correct signed-in redirect and provide loop-safe fallback/recovery.

## G2-6-031-040  [P2] GAP  facet F13  effort S
- Legacy: Legacy OTP send failure marks phoneNumValid=false, leaves initial entry form (SuperAdminLogin.js:305-330).
- vNext now: vNext persistent inline error + resend cooldown/restarter for typed errors (login-form.tsx:166-197,198-247).
- Fix: Match failure location/retry behavior, keep no account enumeration.

## G2-6-031-044  [P2] GAP  facet F16  effort M
- Legacy: Legacy form col-8 col-md-3 ms-5 with DefaultLoginBackground percent layers and margin-top (SuperAdminLogin.js:99-112; DefaultLoginBackground.jsx:1-20).
- vNext now: vNext center max468 card, breakpoint CSS phone adaptations (login-shell.module.css:86-116,212-227).
- Fix: Reproduce desktop/right-column alignment and mobile spacing using measured SCSS.

## G2-6-031-046  [P2] GAP  facet F17  effort M
- Legacy: Legacy Terms Checkbox keyboard controls submit disabled until checked (SuperAdminLogin.js:192-215).
- vNext now: vNext no checkbox and Verify enabled by code length/ busy (login-form.tsx:512-523,561-570).
- Fix: Reinstate checkbox focus/announcement if consent retention required.

## G2-6-031-047  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact visible Mobile Number, Send OTP, OTP sent to your Mobile Number, Enter OTP, Login, OTP Sent!, OTP InValid! (SuperAdminLogin.js:119-211,290-320).
- vNext now: vNext Sign in, Mobile number, Continue, Enter your code, Verify and sign in, notices/errors differ (login-form.tsx:317-325,407-438,467-523).
- Fix: Restore legacy wording or owner-approved diff inventory for shared login.

## G2-6-031-010  [P3] GAP  facet F03  effort S
- Legacy: Legacy header logo at https://42lms.com/assets/images/login/logoo.png, alt 42LMS logo (LoginHeader.js:1-20).
- vNext now: vNext local /assets/images/legacy-42lms-logo.svg alt 42LMS (app/page.tsx:148-154).
- Fix: Compare pixel-level logo size/asset typography and alt string.
