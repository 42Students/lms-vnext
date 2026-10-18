# UX rollout: /platform

**Source:** `src/app/platform/page.tsx`  
**Lane:** chat-17, public second-half  
**Status:** Implemented in source; test execution and device/browser sign-off pending orchestrator.

## Previous weakness
The complete talent lifecycle was visually lost as a plain paragraph on large screens and could wrap awkwardly on narrow ones.

## Changes (legacy wording unchanged)
Retained role, agent and pillar copy exactly, placed the existing lifecycle sentence into a scannable responsive surfaced section, inherited shared 44px navigation and hero controls.

## States and safety
Static pillars, lifecycle and request-demo navigation.

## Tests and acceptance
- `UX-public-platform-01` in `tests/ux-public-second-half.test.mjs` (added to `ux:audit:source`).
- Audit on 320/360/390/768/1280, keyboard/focus, real browser and assistive technology is orchestrator-owned; no fabricated passes.
- Existing platform/tenant privacy, auth and route semantics remain authoritative.
