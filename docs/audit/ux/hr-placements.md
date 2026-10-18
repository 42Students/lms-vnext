# UX rollout — /hr/placements

- **Route:** src/app/(authenticated)/hr/placements/page.tsx
- **Test:** UX-hr-placements-01 (`tests/ux-hr-rollout-02.test.mjs`).
- **Initial weakness:** Shared recruiter portfolio already owns row interactions, so a second parallel list here would weaken navigation and duplicate data.
- **Change:** Retained PageHeader and the shared RecruiterPlacementPortfolio; no extra table, duplicated actions or invented copy.
- **States:** Original authentication, no-access, invalid query, empty/loading, conflict and pagination handling is unchanged; no new implied server behavior. Capture/AT remains orchestrator-owned.
- **Validation:** Named source invariant regression test authored; no local npm typecheck, lint, browser or device execution claimed.
