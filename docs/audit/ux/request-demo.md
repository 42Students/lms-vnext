# UX rollout: /request-demo

**Source:** `src/app/request-demo/page.tsx`  
**Lane:** chat-17, public second-half  
**Status:** Implemented in source; test execution and device/browser sign-off pending orchestrator.

## Previous weakness
Long introductory heading and primary mail link were cramped on small screens and lacked an explicit focus treatment.

## Changes (legacy wording unchanged)
Retained the complete no-form email-contact workflow and all existing copy. Adjusted 320px heading/section padding, readable paragraph, full-width phone CTA, 44px+ target and visible focus.

## States and safety
Content-only email handoff and no-data-collected note; native email app unavailable remains user-controlled.

## Tests and acceptance
- `UX-public-request-demo-01` in `tests/ux-public-second-half.test.mjs` (added to `ux:audit:source`).
- Audit on 320/360/390/768/1280, keyboard/focus, real browser and assistive technology is orchestrator-owned; no fabricated passes.
- Existing platform/tenant privacy, auth and route semantics remain authoritative.
