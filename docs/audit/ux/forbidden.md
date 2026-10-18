# UX rollout: /forbidden

**Source:** `src/app/forbidden/page.tsx`  
**Lane:** chat-17, public second-half  
**Status:** Implemented in source; test execution and device/browser sign-off pending orchestrator.

## Previous weakness
The denial page already uses the shared GracefulScreen; avoid changing the access message or its safe destination.

## Changes (legacy wording unchanged)
Preserved GracefulScreen with original title/message and /dashboard destination; added noindex/nofollow page metadata so private errors are not indexed. The shared GracefulScreen continues to supply keyboard-focusable return navigation.

## States and safety
Permission denial and recovery link; no redirect loop.

## Tests and acceptance
- `UX-public-forbidden-01` in `tests/ux-public-second-half.test.mjs` (added to `ux:audit:source`).
- Audit on 320/360/390/768/1280, keyboard/focus, real browser and assistive technology is orchestrator-owned; no fabricated passes.
- Existing platform/tenant privacy, auth and route semantics remain authoritative.
