# UX rollout: /company-share/[token]

**Source:** `src/app/company-share/[token]/page.tsx`  
**Lane:** chat-17, public second-half  
**Status:** Implemented in source; test execution and device/browser sign-off pending orchestrator.

## Previous weakness
Sensitive share code/search controls used custom small controls and the shortlist duplicated separate mobile and desktop row DOM; paging was a bare link strip.

## Changes (legacy wording unchanged)
Retained service-driven permissions, selected columns, proof cookie, share expiry, confidentiality watermark and legacy messages. Replaced code/search controls with shared Input and Button and authorized result view with shared DataTable (mandatory exact empty copy) and Pagination; 44px+ actions and safe-area-aware layout.

## States and safety
6-digit code required/invalid, temporary share service failure with same-link retry, expired/withdrawn share, ready shortlist, empty filtered set with Clear, search URL, pagination, CSV export. Never reveals columns outside safeCompanyShareColumns.

## Tests and acceptance
- `UX-public-company-share-01` in `tests/ux-public-second-half.test.mjs` (added to `ux:audit:source`).
- Audit on 320/360/390/768/1280, keyboard/focus, real browser and assistive technology is orchestrator-owned; no fabricated passes.
- Existing platform/tenant privacy, auth and route semantics remain authoritative.
