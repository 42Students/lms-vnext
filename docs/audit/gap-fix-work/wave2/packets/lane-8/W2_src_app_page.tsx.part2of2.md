# Work packet (wave 2): edit src/app/page.tsx (part 2 of 2)

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-handoff-page.md, docs/audit/gap2/lane-20/index.md

## G2-1-024-010  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:159: gray #666 error detail with bottom margin16.
- vNext now: src/app/page.tsx:150-155: status warning message, no inline operation error detail.
- Fix: Show safe error detail for failed secure handoff; never reflect raw token.

## G2-1-024-017  [P3] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:160-163: actions in display:flex gap8, wrapping on narrow screens.
- vNext now: src/app/page.tsx:149-176: login screen with different controls, not action row.
- Fix: If retained, preserve wrapping two-button row.

## G2-1-024-043  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:160: action row flex-wrap:wrap and gap8.
- vNext now: src/app/page.tsx:150-178: different login form controls.
- Fix: Preserve wrapping primary/secondary action targets.

## G2-20-006-016  [P3] GAP  facet F04  effort S
- Legacy: Legacy JNTU phone placeholder `Enter mobile number`, OTP placeholder `Enter OTP`; `docs/legacy-source/frontend/src/loginPages/JntuLogin.js:97-119,139-155`
- vNext now: New shared default phone/email/OTP fields; no JNTU-specific placeholder branch; `src/app/page.tsx:173-177`, `src/components/auth/login-form.tsx:114-123`
- Fix: Restore host-specific placeholders when JNTU mode retained.

## G2-20-006-048  [P3] GAP  facet F13  effort S
- Legacy: Legacy JNTU/DGIPUC variants initially spinner while checking isLoggedIn, then render; `docs/legacy-source/frontend/src/loginPages/JntuLogin.js:23-24,65-68`, `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:23-25,65-69`
- vNext now: New shared server-based root may redirect signed-in session; `src/app/page.tsx:20-27,91-92`
- Fix: Compare initial loading flash for each tenant and match correct shell while staying server-safe.

## G2-20-006-050  [P3] GAP  facet F14  effort S
- Legacy: Legacy JNTU page uses static JNTU logo image and DGIPUC custom background; `docs/legacy-source/frontend/src/loginPages/JntuLogin.js:73-79`, `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:65-68`
- vNext now: New login asset logo SVG, optional remote tenant logos and background URLs; `src/app/page.tsx:121-145`
- Fix: Provide tenant asset mapping/remote-brand consistency; no upload action in login itself.

## G2-20-006-060  [P3] GAP  facet F18  effort S
- Legacy: Root tab title exact `42 LMS`; `docs/legacy-source/frontend/src/pages/index.js:33-34`
- vNext now: Dynamic `Sign in · 42LMS` with metadata parent template; `src/app/page.tsx:14-17`, `src/app/layout.tsx:11-14`
- Fix: Match title if 42 LMS root tab fidelity necessary.
