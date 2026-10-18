# UX rollout: / (listed as /page.tsx)

**Source:** `src/app/page.tsx`  
**Lane:** chat-17, public second-half  
**Status:** Implemented in source; test execution and device/browser sign-off pending orchestrator.

## Previous weakness
Branded sign-in could crowd a 320px view, ignore safe areas, and present small footer contact links.

## Changes (legacy wording unchanged)
Preserved tenant-safe hostname and returnTo handling, existing copy, exact unavailable/unknown/login branches and original OTP form; adjusted safe-area-aware minimum viewport, card spacing, heading wrapping, and footer link focus/touch bounds.

## States and safety
Authenticated redirect, explicit /login, platform marketing redirect, unavailable/unknown tenant, auth error, OTP entry, email/tel/legal links.

## Tests and acceptance
- `UX-public-page_tsx-01` in `tests/ux-public-second-half.test.mjs` (added to `ux:audit:source`).
- Audit on 320/360/390/768/1280, keyboard/focus, real browser and assistive technology is orchestrator-owned; no fabricated passes.
- Existing platform/tenant privacy, auth and route semantics remain authoritative.
