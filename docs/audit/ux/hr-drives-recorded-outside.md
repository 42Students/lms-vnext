# UX rollout — /hr/drives/recorded-outside

- **Route:** src/app/(authenticated)/hr/drives/recorded-outside/page.tsx
- **Test:** UX-hr-drives-recorded-outside-01 (`tests/ux-hr-rollout-02.test.mjs`).
- **Initial weakness:** 2 low-contrast `text-primary-text` utility occurrences and missing keyboard-visible link/button focus; some independent native fields used small phone text.
- **Change:** Preserved all words, exact status names, API permissions and server reads/writes. Updated to readable deep-teal link utility, consistent 2px keyboard focus outlines on 2 links and 0 buttons, and 44px targets/phone input typography on 0 native fields. Kept shared page and state primitives and original guarded workflows.
- **States:** Original authentication, no-access, invalid query, empty/loading, conflict and pagination handling is unchanged; no new implied server behavior. Capture/AT remains orchestrator-owned.
- **Validation:** Named source invariant regression test authored; no local npm typecheck, lint, browser or device execution claimed.
