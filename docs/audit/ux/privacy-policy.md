# UX rollout: /privacy-policy

**Source:** `src/app/privacy-policy/page.tsx`  
**Lane:** chat-17, public second-half  
**Status:** Implemented in source; test execution and device/browser sign-off pending orchestrator.

## Previous weakness
Privacy route must not replace, shorten or rewrite the full legacy policy.

## Changes (legacy wording unchanged)
Preserved server redirect to the exact existing /assets/static/privacy-policy-view.html and added page metadata only. No duplicate or invented privacy text.

## States and safety
Canonical static policy destination; redirect behavior unchanged.

## Tests and acceptance
- `UX-public-privacy-policy-01` in `tests/ux-public-second-half.test.mjs` (added to `ux:audit:source`).
- Audit on 320/360/390/768/1280, keyboard/focus, real browser and assistive technology is orchestrator-owned; no fabricated passes.
- Existing platform/tenant privacy, auth and route semantics remain authoritative.
