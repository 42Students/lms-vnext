# UX rollout: /account/security

**Source:** `src/app/(authenticated)/account/security/page.tsx`  
**Lane:** chat-17, public second-half  
**Status:** Implemented in source; test execution and device/browser sign-off pending orchestrator.

## Previous weakness
Service failure previously escaped the route into an unhelpful error; signing devices out had no explicit consequence confirmation or fetch rejection handling.

## Changes (legacy wording unchanged)
Kept PageHeader, EmptyState and current-device distinction. Added shared ErrorState with same existing unavailable copy and retry on session-read failures; shared DeviceList now uses ConfirmDialog to explain revocation, reports transport errors, disables duplicate requests and preserves refresh/toast feedback.

## States and safety
No current session redirect, empty list, list fetch failure, current device, other device sign out, all-other sign out, confirmation cancel/pending/network fail/success.

## Tests and acceptance
- `UX-public-account-security-01` in `tests/ux-public-second-half.test.mjs` (added to `ux:audit:source`).
- Audit on 320/360/390/768/1280, keyboard/focus, real browser and assistive technology is orchestrator-owned; no fabricated passes.
- Existing platform/tenant privacy, auth and route semantics remain authoritative.
