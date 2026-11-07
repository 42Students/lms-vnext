# UX-G123 — Universities public journey

**Owner:** ux-universities-chat-2026-11-07  
**Source:** `src/app/universities/{page,error,loading}.tsx`  
**Status:** Code and automated coverage authored; desktop/mobile *execution evidence* pending.

## Workflow review and changes
- The shared university hero intentionally omitted CTAs for audience pages, leaving the first demo action near the foot of a long page. Added a route-local, early **Request a Demo** action linking to the existing `/request-demo` journey.
- Added a labeled, keyboard-accessible in-page navigation for capabilities and the six-stage student journey, with anchored scroll targets and touch-sized actions. No JavaScript navigation or account state required.
- Removed overhanging absolute connector arrows in the six-stage desktop grid to avoid collisions and unneeded horizontal scroll at intermediate widths.
- Added brief human-operated stage context; retained existing academics, learning, assessment, projects, placements, recruitment, and administration capability descriptions. No unshipped AI or automated-outcomes claims.
- The route error boundary now returns public visitors to `/`, not the authenticated `/dashboard`. Shared retry behavior and sanitized error messaging are unchanged.
- The route loading state identifies the destination and shows a responsive skeleton with the existing slow-loading recovery action.

## Acceptance evidence
- Source assertions: `node --test tests/ux-universities-group.test.mjs` (must be executed).
- Browser tests: `npx playwright test tests/e2e/ux-universities-journey.spec.ts --project=chromium` (must be executed at desktop 1280×800 and mobile 390×844).
- Browser test captures full-page attachments, keyboard link focus, exact internal destinations, and horizontal overflow / runtime errors.
- Run `npm run typecheck`, `npm run ux:guard`, and cross-page marketing regression before claiming DONE.
- No private data requests, auth, RLS, API contract, placement eligibility, or role decision changes in this group.
- **Do not mark UX-G123 DONE** until exact-SHA test results, rendered desktop/mobile proof, and regression review are recorded in `docs/parity/shared-public-ops.md`.
