# UX rollout: /home

**Source:** `src/app/home/page.tsx`  
**Lane:** chat-17, public second-half  
**Status:** Implemented in source; test execution and device/browser sign-off pending orchestrator.

## Previous weakness
Audience cards and the journey grid needed clearer mobile hierarchy and visible keyboard focus.

## Changes (legacy wording unchanged)
Retained all marketing hero, feature, audience and journey copy; audience cards are keyboard-discernible links with focus outlines and responsive 1/2 columns; journey becomes 1/2/4 columns. Shared MarketingLayout handles 44px navigation and CTAs.

## States and safety
Static hero, responsive audience discovery and CTA; no new data or network dependency.

## Tests and acceptance
- `UX-public-home-01` in `tests/ux-public-second-half.test.mjs` (added to `ux:audit:source`).
- Audit on 320/360/390/768/1280, keyboard/focus, real browser and assistive technology is orchestrator-owned; no fabricated passes.
- Existing platform/tenant privacy, auth and route semantics remain authoritative.
