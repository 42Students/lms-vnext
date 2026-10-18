# UX rollout: /universities

**Source:** `src/app/universities/page.tsx`  
**Lane:** chat-17, public second-half  
**Status:** Implemented in source; test execution and device/browser sign-off pending orchestrator.

## Previous weakness
Five campus roles need predictable grouping and mobile-first scanning without changing role names.

## Changes (legacy wording unchanged)
Retained all campus role labels and descriptions; grouped them inside the responsive shared MarketingFeatureGrid / layout and inherited accessible navigation and CTA targets.

## States and safety
Static campuses roles and request-demo navigation.

## Tests and acceptance
- `UX-public-universities-01` in `tests/ux-public-second-half.test.mjs` (added to `ux:audit:source`).
- Audit on 320/360/390/768/1280, keyboard/focus, real browser and assistive technology is orchestrator-owned; no fabricated passes.
- Existing platform/tenant privacy, auth and route semantics remain authoritative.
