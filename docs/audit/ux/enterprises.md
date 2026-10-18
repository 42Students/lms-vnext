# UX rollout: /enterprises

**Source:** `src/app/enterprises/page.tsx`  
**Lane:** chat-17, public second-half  
**Status:** Implemented in source; test execution and device/browser sign-off pending orchestrator.

## Previous weakness
Enterprise capabilities benefited from clearer grouping and the same responsive marketing shell as the other public destinations.

## Changes (legacy wording unchanged)
Retained exact enterprise hero, title, features and CTA. Grouped capabilities and inherited 44px keyboard-accessible shared marketing navigation, mobile cards and CTA.

## States and safety
Static feature discovery and request-demo navigation; no false form/data states.

## Tests and acceptance
- `UX-public-enterprises-01` in `tests/ux-public-second-half.test.mjs` (added to `ux:audit:source`).
- Audit on 320/360/390/768/1280, keyboard/focus, real browser and assistive technology is orchestrator-owned; no fabricated passes.
- Existing platform/tenant privacy, auth and route semantics remain authoritative.
