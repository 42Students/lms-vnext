# UX rollout — /hr/drives/[jobId]/rounds/editor

- **Route:** src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx
- **Test:** UX-hr-drives-jobId-rounds-editor-01 (`tests/ux-hr-rollout-02.test.mjs`).
- **Initial weakness:** 3 low-contrast `text-primary-text` utility occurrences and missing keyboard-visible link/button focus; some independent native fields used small phone text.
- **Change:** Preserved all words, exact status names, API permissions and server reads/writes. Updated to readable deep-teal link utility, consistent 2px keyboard focus outlines on 3 links and 2 buttons, and 44px targets/phone input typography on 7 native fields. Kept shared page and state primitives and original guarded workflows.
- **States:** Original authentication, no-access, invalid query, empty/loading, conflict and pagination handling is unchanged; no new implied server behavior. Capture/AT remains orchestrator-owned.
- **Validation:** Named source invariant regression test authored; no local npm typecheck, lint, browser or device execution claimed.

## Chat-19 second-pass inline rounds authoring

- HR-BREAK-ROUND-RECEIPT-31: Client mutations require an exact JSON persisted-action receipt; a generic HTTP 200 or sign-in redirect cannot claim success. The native form retains its existing 303 flow. Regression: `tests/unit/HR-BREAK-chat19-round-receipt.test.ts`.
- UX-HR-ROUND-UNSAVED-32: Closing a changed inline editor via Escape/backdrop/Cancel requires explicit discard. Pending, untouched and destructive removal states remain separate. Regression: `tests/unit/UX-HR-chat19-round-unsaved.test.ts`.
- Real browser keyboard/focus acceptance is still pending.
