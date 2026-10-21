# Work packet (wave 3): edit src/app/api/auth/memberships/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md

## G2-1-002-002  [P1] MISSING  facet F01  effort L
- Legacy: `AuthController.java:220-287` POST `/switch`; `:417-492` POST `/switch-token` explicitly for native mobile.
- vNext now: `src/app/api/auth/memberships/route.ts:98-177` POST switches by membership UUID and optional role; no JWT token-pair mobile switch endpoint mapped.
- Fix: Decide mobile compatibility; provide supported cookie-less native auth scope switch or explicitly retire supported mobile clients.

## G2-1-002-014  [P1] MISSING  facet F04  effort L
- Legacy: `AuthController.java:441-448,484-491` `/switch-token` includes raw token pair, TTL and org/college IDs.
- vNext now: `src/app/api/auth/memberships/route.ts:147-173` returns selected membership object without native token pair.
- Fix: Explicitly retire or implement mobile auth selection contract; document session transport supported by mobile.

## G2-1-002-059  [P1] MISSING  facet F16  effort L
- Legacy: `AuthController.java:417-492` explicitly supports native mobile switching with `/switch-token` token pair; no redirect.
- vNext now: `src/app/api/auth/memberships/route.ts:98-177` uses browser HttpOnly cookies and no native token pair.
- Fix: Provide documented supported native-auth strategy or mobile deprecation decision; run actual mobile deep-link/switch test.
