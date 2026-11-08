# UX-G149 · TPO placement controls — scoped responsive and safety acceptance

**Status:** DONE (2026-11-08). This is component-level UX acceptance, not a certification of production authenticated TPO write flows or release.

## Registered components
- `src/components/placements/tpo-selection-import.tsx`
- `src/components/placements/tpo-waitlist-promotion-control.tsx`
- `src/components/placements/tpo-week-hour-calendar.tsx`

## Executed evidence
- [Exact-SHA successful CI](https://github.com/42Students/lms-vnext/actions/runs/42462557010), at [commit `1ee7b8c2a536ea257708c5d6f4315545a70dcac3`](https://github.com/42Students/lms-vnext/commit/1ee7b8c2a536ea257708c5d6f4315545a70dcac3): scoped ESLint, full TypeScript, **4/4 Node source safety checks**, **16/16 focused and existing Vitest tests**, and **7/7 Chromium tests**.
- Desktop viewport **1280×800**, mobile viewport **390×844**, actual registered React components in strictly development-only synthetic fixtures with intercepted request writes, screenshots in [artifact 13610697317](https://github.com/42Students/lms-vnext/actions/runs/42462557010/artifacts/13610697317).
- Browser scenarios covered 101 matched selection rows with partial 100-row success then 503 rejection, cancellation not writing, reconciliation lock; ambiguous waitlist issuance and disabled repeat submission; superseded async recruiter response not restoring stale calendar data; nonoverflow desktop and mobile.
- Anonymous real API POSTs to selections and waitlist endpoints were denied. No request in the positive synthetic component tests wrote to production or a real tenant.
- A later compare against `main` at `40f9424797b3655ae955c4091d8a1e99c31a1604` found **no changes to any of the three registered component files** after the successful source SHA.

## Scope limitations
- Browser tests are synthetic component journeys; authenticated real TPO role/tenant positive writes and production provider operations remain separately gated.
- No authorization, RLS, role grants or tenant safety checks were loosened in this UX closure.
