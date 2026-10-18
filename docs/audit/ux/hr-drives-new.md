# UX rollout — /hr/drives/new

- **Route:** src/app/(authenticated)/hr/drives/new/page.tsx
- **Test:** UX-hr-drives-new-01 (`tests/ux-hr-rollout-02.test.mjs`).
- **Initial weakness:** 4 low-contrast `text-primary-text` utility occurrences and missing keyboard-visible link/button focus; some independent native fields used small phone text.
- **Change:** Preserved all words, exact status names, API permissions and server reads/writes. Updated to readable deep-teal link utility, consistent 2px keyboard focus outlines on 4 links and 0 buttons, and 44px targets/phone input typography on 0 native fields. Kept shared page and state primitives and original guarded workflows.
- **States:** Original authentication, no-access, invalid query, empty/loading, conflict and pagination handling is unchanged; no new implied server behavior. Capture/AT remains orchestrator-owned.
- **Validation:** Named source invariant regression test authored; no local npm typecheck, lint, browser or device execution claimed.

## Chat-19 second-pass state hardening

- HR-BREAK-DRIVE-DRAFT-SCOPE-38: Key the hook-owning request form by recruiter, college, action (NEW/FROM/COPY/EDIT/FIX), and source request/job. This prevents a prior college's unsent title, CTC, version and submission token from following URL-only navigation. COPY has a separate local draft namespace. Regression: `tests/unit/HR-BREAK-chat19-drive-draft-scope.test.ts`.
- HR-BREAK-DRIVE-RECEIPT-33: The Drives page recognizes the exact verified success flash emitted by the request form, but cannot invent success from arbitrary session values. Regression: `tests/unit/HR-BREAK-chat19-drive-receipt.test.ts`.
- Browser history and storage recovery remain acceptance gates; tests were not executed locally.
